import sys
import unittest
from datetime import datetime
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal
from app.dev_seed import ensure_dev_demo_data
from app.models import Card, Contact, User


class DevSeedTests(unittest.TestCase):
    def setUp(self):
        with SessionLocal() as db:
            user = db.query(User).filter(User.wechat_openid == 'wx_local_dev_user_seed_case').first()
            if not user:
                user = User(
                    wechat_openid='wx_local_dev_user_seed_case',
                    nickname='种子测试用户',
                    source='miniapp',
                    last_login_at=datetime.utcnow(),
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            self.user_id = user.id

            owner_card = db.query(Card).filter(Card.user_id == user.id, Card.is_default.is_(True)).first()
            if not owner_card:
                owner_card = db.query(Card).filter(Card.user_id == user.id, Card.title == '测试默认名片').first()
            if not owner_card:
                owner_card = Card(
                    user_id=user.id,
                    title='测试默认名片',
                    template='developer',
                    is_default=True,
                    name='陈小独立',
                    role='本人默认名片',
                    company='壹席eSeat',
                )
                db.add(owner_card)
                db.commit()
                db.refresh(owner_card)
            self.owner_card_id = owner_card.id

            stale_contact = db.query(Contact).filter(
                Contact.owner_user_id == user.id,
                Contact.contact_user_id == user.id,
            ).first()
            if not stale_contact:
                db.add(
                    Contact(
                        owner_user_id=user.id,
                        contact_user_id=user.id,
                        source_card_id=owner_card.id,
                        target_card_id=owner_card.id,
                        status='active',
                        latest_interaction_text='旧的错误案例',
                    )
                )
                db.commit()

    def test_seed_refreshes_distinct_demo_contacts_even_with_existing_cards(self):
        with SessionLocal() as db:
            user = db.get(User, self.user_id)
            ensure_dev_demo_data(db, user)

        with SessionLocal() as db:
            contacts = db.query(Contact).filter(Contact.owner_user_id == self.user_id).all()
            distinct_demo_contacts = [
                item for item in contacts
                if item.contact_user_id != self.user_id and item.target_card_id != self.owner_card_id
            ]

            self.assertGreaterEqual(len(distinct_demo_contacts), 3)

            sample_cards = db.query(Card).filter(Card.id.in_([item.target_card_id for item in distinct_demo_contacts])).all()
            sample_names = {item.name for item in sample_cards}
            self.assertIn('林知远', sample_names)
            self.assertIn('苏念', sample_names)
            self.assertIn('赵一帆', sample_names)


if __name__ == '__main__':
    unittest.main()