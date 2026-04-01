import sys
import unittest
from datetime import datetime
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal
from app.dev_seed import ensure_dev_demo_data
from app.models import Card, Contact, ExchangeRecord, User
from app.routers.contacts import (
    ExchangeRequestBody,
    approve_contact,
    create_exchange_request,
    list_contacts,
    reject_contact,
)


class ExchangeRecordFlowTests(unittest.TestCase):
    def setUp(self):
        with SessionLocal() as db:
            user = db.query(User).filter(User.wechat_openid == 'wx_local_dev_user').first()
            if not user:
                user = User(
                    wechat_openid='wx_local_dev_user',
                    nickname='新用户',
                    source='miniapp',
                    last_login_at=datetime.utcnow(),
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            ensure_dev_demo_data(db, user)
            db.commit()
            self.user_id = user.id

        self.target_user_id = ''
        self.target_card_id = ''
        self.requester_card_id = ''
        self._prepare_target()

    def _prepare_target(self):
        with SessionLocal() as db:
            requester_card = db.query(Card).filter(Card.user_id == self.user_id).order_by(Card.is_default.desc(), Card.created_at.asc()).first()
            if not requester_card:
                self.fail('当前用户缺少可用名片')
            self.requester_card_id = requester_card.id

            target_card = db.query(Card).filter(Card.user_id != self.user_id).order_by(Card.created_at.asc()).first()
            if not target_card:
                self.fail('未找到可用的目标名片')
            self.target_card_id = target_card.id
            self.target_user_id = target_card.user_id

            db.query(Contact).filter(
                Contact.owner_user_id.in_([self.user_id, self.target_user_id]),
                Contact.contact_user_id.in_([self.user_id, self.target_user_id]),
            ).delete(synchronize_session=False)

            db.query(ExchangeRecord).filter(
                ExchangeRecord.requester_user_id == self.user_id,
                ExchangeRecord.target_user_id == self.target_user_id,
            ).delete(synchronize_session=False)
            db.commit()

    def _create_exchange_request(self):
        with SessionLocal() as db:
            result = create_exchange_request(
                ExchangeRequestBody(target_card_id=self.target_card_id),
                x_user_id=self.user_id,
                db=db,
            )
            self.assertTrue(result.get('success'), result)

    def _get_pending_contact_id(self):
        with SessionLocal() as db:
            contact = db.query(Contact).filter(
                Contact.owner_user_id == self.target_user_id,
                Contact.contact_user_id == self.user_id,
                Contact.status == 'pending',
            ).order_by(Contact.created_at.desc()).first()
            self.assertIsNotNone(contact, '目标用户侧未生成 pending 联系人')
            return contact.id

    def test_pending_sent_not_returned_as_active_contact(self):
        self._create_exchange_request()

        with SessionLocal() as db:
            requester_view = list_contacts(x_user_id=self.user_id, db=db)

        requester_pending_target = [item for item in requester_view.pendingRequests if item.cardId == self.target_card_id]
        requester_active_target = [item for item in requester_view.contacts if item.cardId == self.target_card_id]
        self.assertEqual(len(requester_pending_target), 0)
        self.assertEqual(len(requester_active_target), 0)

        with SessionLocal() as db:
            target_view = list_contacts(x_user_id=self.target_user_id, db=db)

        target_pending_requester = [item for item in target_view.pendingRequests if item.cardId == self.requester_card_id]
        target_active_requester = [item for item in target_view.contacts if item.cardId == self.requester_card_id]
        self.assertEqual(len(target_pending_requester), 1)
        self.assertEqual(target_pending_requester[0].status, 'pending')
        self.assertEqual(len(target_active_requester), 0)

    def test_approve_moves_both_sides_into_active_contacts(self):
        self._create_exchange_request()
        contact_id = self._get_pending_contact_id()

        with SessionLocal() as db:
            result = approve_contact(contact_id, x_user_id=self.target_user_id, db=db)
            self.assertTrue(result.get('success'), result)

        with SessionLocal() as db:
            requester_view = list_contacts(x_user_id=self.user_id, db=db)
        requester_pending_target = [item for item in requester_view.pendingRequests if item.cardId == self.target_card_id]
        requester_active_target = [item for item in requester_view.contacts if item.cardId == self.target_card_id]
        self.assertEqual(len(requester_pending_target), 0)
        self.assertEqual(len(requester_active_target), 1)
        self.assertEqual(requester_active_target[0].status, 'active')

        with SessionLocal() as db:
            target_view = list_contacts(x_user_id=self.target_user_id, db=db)
        target_pending_requester = [item for item in target_view.pendingRequests if item.cardId == self.requester_card_id]
        target_active_requester = [item for item in target_view.contacts if item.cardId == self.requester_card_id]
        self.assertEqual(len(target_pending_requester), 0)
        self.assertEqual(len(target_active_requester), 1)
        self.assertEqual(target_active_requester[0].status, 'active')

    def test_reject_hides_request_from_contact_lists(self):
        self._create_exchange_request()
        contact_id = self._get_pending_contact_id()

        with SessionLocal() as db:
            result = reject_contact(contact_id, x_user_id=self.target_user_id, db=db)
            self.assertTrue(result.get('success'), result)

        with SessionLocal() as db:
            requester_view = list_contacts(x_user_id=self.user_id, db=db)
        requester_pending_target = [item for item in requester_view.pendingRequests if item.cardId == self.target_card_id]
        requester_active_target = [item for item in requester_view.contacts if item.cardId == self.target_card_id]
        self.assertEqual(len(requester_pending_target), 0)
        self.assertEqual(len(requester_active_target), 0)

        with SessionLocal() as db:
            target_view = list_contacts(x_user_id=self.target_user_id, db=db)
        target_pending_requester = [item for item in target_view.pendingRequests if item.cardId == self.requester_card_id]
        target_active_requester = [item for item in target_view.contacts if item.cardId == self.requester_card_id]
        self.assertEqual(len(target_pending_requester), 0)
        self.assertEqual(len(target_active_requester), 0)

    def test_approve_updates_exchange_record_status(self):
        self._create_exchange_request()
        contact_id = self._get_pending_contact_id()

        with SessionLocal() as db:
            result = approve_contact(contact_id, x_user_id=self.target_user_id, db=db)
            self.assertTrue(result.get('success'), result)

        with SessionLocal() as db:
            record = db.query(ExchangeRecord).filter(
                ExchangeRecord.requester_user_id == self.user_id,
                ExchangeRecord.target_user_id == self.target_user_id,
            ).order_by(ExchangeRecord.created_at.desc()).first()
            self.assertIsNotNone(record, '未写入 exchange_records')
            self.assertEqual(record.status, 'approved')

    def test_reject_updates_exchange_record_status(self):
        self._create_exchange_request()
        contact_id = self._get_pending_contact_id()

        with SessionLocal() as db:
            result = reject_contact(contact_id, x_user_id=self.target_user_id, db=db)
            self.assertTrue(result.get('success'), result)

        with SessionLocal() as db:
            record = db.query(ExchangeRecord).filter(
                ExchangeRecord.requester_user_id == self.user_id,
                ExchangeRecord.target_user_id == self.target_user_id,
            ).order_by(ExchangeRecord.created_at.desc()).first()
            self.assertIsNotNone(record, '未写入 exchange_records')
            self.assertEqual(record.status, 'rejected')


if __name__ == '__main__':
    unittest.main()