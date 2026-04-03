import json
import sys
import unittest
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal
from app.dev_seed import ensure_dev_demo_data
from app.models import Setting, User
from app.routers import auth as auth_router
from app.schemas import WechatLoginRequest


class _FakeResp:
    def __init__(self, body: dict):
        self._payload = json.dumps(body).encode("utf-8")

    def read(self) -> bytes:
        return self._payload


@contextmanager
def _fake_urlopen_success(_req, timeout=10):
    del timeout
    yield _FakeResp({"openid": "wx_real_user_123", "session_key": "mock_session_key"})


class AuthWechatLoginTests(unittest.TestCase):
    def setUp(self):
        self.openid = "wx_settings_compat_user"
        with SessionLocal() as db:
            user = db.query(User).filter(User.wechat_openid == self.openid).first()
            if not user:
                user = User(
                    wechat_openid=self.openid,
                    nickname="settings compat",
                    source="miniapp",
                    last_login_at=datetime.utcnow(),
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            self.user_id = user.id

    def test_wechat_login_uses_real_openid_when_wechat_configured(self):
        payload = WechatLoginRequest(code="code_from_wechat")
        with SessionLocal() as db:
            with patch.object(auth_router, "settings", type("_S", (), {
                "wechat_app_id": "wx_test_appid",
                "wechat_app_secret": "wx_test_secret",
                "app_env": "development",
            })(), create=True):
                with patch.object(auth_router.urllib_request, "urlopen", side_effect=_fake_urlopen_success):
                    result = auth_router.wechat_login(payload, db)

        self.assertEqual(result.openid, "wx_real_user_123")
        self.assertNotEqual(result.openid, auth_router.DEV_OPENID)

    def test_wechat_login_falls_back_to_dev_openid_when_secret_is_placeholder(self):
        payload = WechatLoginRequest(code="code_from_wechat")
        with SessionLocal() as db:
            with patch.object(auth_router, "settings", type("_S", (), {
                "wechat_app_id": "wx_test_appid",
                "wechat_app_secret": "replace_me",
                "app_env": "development",
            })(), create=True):
                result = auth_router.wechat_login(payload, db)

        self.assertEqual(result.openid, auth_router.DEV_OPENID)

    def test_wechat_login_does_not_seed_demo_data_for_real_openid(self):
        payload = WechatLoginRequest(code="code_from_wechat")
        with SessionLocal() as db:
            with patch.object(auth_router, "settings", type("_S", (), {
                "wechat_app_id": "wx_test_appid",
                "wechat_app_secret": "wx_test_secret",
                "app_env": "development",
            })(), create=True):
                with patch.object(auth_router.urllib_request, "urlopen", side_effect=_fake_urlopen_success):
                    with patch.object(auth_router, "ensure_dev_demo_data") as seed_mock:
                        result = auth_router.wechat_login(payload, db)

        self.assertEqual(result.openid, "wx_real_user_123")
        seed_mock.assert_not_called()

    def test_wechat_login_skips_repeat_dev_seed_when_data_already_exists(self):
        payload = WechatLoginRequest(code="code_from_wechat")
        with SessionLocal() as db:
            dev_user = db.query(User).filter(User.wechat_openid == auth_router.DEV_OPENID).first()
            if not dev_user:
                dev_user = User(
                    wechat_openid=auth_router.DEV_OPENID,
                    nickname="dev user",
                    source="miniapp",
                    last_login_at=datetime.utcnow(),
                )
                db.add(dev_user)
                db.commit()
                db.refresh(dev_user)
            ensure_dev_demo_data(db, dev_user)
            db.commit()

            with patch.object(auth_router, "settings", type("_S", (), {
                "wechat_app_id": "wx_test_appid",
                "wechat_app_secret": "replace_me",
                "app_env": "development",
            })(), create=True):
                with patch.object(auth_router, "ensure_dev_demo_data") as seed_mock:
                    result = auth_router.wechat_login(payload, db)

        self.assertEqual(result.openid, auth_router.DEV_OPENID)
        seed_mock.assert_not_called()

    def test_update_settings_preserves_existing_blacklist_entries(self):
        with SessionLocal() as db:
            setting = db.query(Setting).filter(Setting.user_id == self.user_id).first()
            if not setting:
                setting = Setting(user_id=self.user_id)
                db.add(setting)
            setting.blacklist_json = json.dumps(
                [{"id": "blk_keep", "name": "should stay"}],
                ensure_ascii=False,
            )
            db.commit()

            auth_router.update_settings(
                auth_router.SettingsUpdateRequest(allow_ai_contacts_context=True),
                x_user_id=self.user_id,
                db=db,
            )
            db.refresh(setting)

        stored = json.loads(setting.blacklist_json)
        self.assertIsInstance(stored, dict)
        self.assertEqual(stored.get("blacklist"), [{"id": "blk_keep", "name": "should stay"}])
        self.assertTrue(stored.get("allow_ai_contacts_context"))


if __name__ == "__main__":
    unittest.main()
