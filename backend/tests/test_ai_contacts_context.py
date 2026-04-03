import sys
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal
from app.dev_seed import ensure_dev_demo_data
from app.models import User
from app.routers import auth as auth_router
from app.routers import ai as ai_router


class AiContactsContextTests(unittest.TestCase):
    def setUp(self):
        with SessionLocal() as db:
            user = db.query(User).filter(User.wechat_openid == 'wx_ai_contacts_ctx').first()
            if not user:
                user = User(
                    wechat_openid='wx_ai_contacts_ctx',
                    nickname='AI 联系人上下文测试用户',
                    source='miniapp',
                    last_login_at=datetime.utcnow(),
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            ensure_dev_demo_data(db, user)
            db.commit()
            self.user_id = user.id

    def test_generate_chat_requires_backend_authorization(self):
        with SessionLocal() as db:
            captured_prompts = []

            def fake_call_llm(prompt, system_prompt, provider=None, trace=None):
                captured_prompts.append(prompt)
                return {'choices': [{'message': {'content': '推荐结果'}}]}

            with patch.object(ai_router, 'call_llm', side_effect=fake_call_llm):
                auth_router.update_settings(
                    auth_router.SettingsUpdateRequest(allow_ai_contacts_context=True),
                    x_user_id=self.user_id,
                    db=db,
                )

                authorized = ai_router.generate(
                    {
                        'type': 'chat',
                        'provider': 'qwen',
                        'data': {
                            'message': '帮我推荐合作人',
                            'allowContactsContext': True,
                        },
                    },
                    x_user_id=self.user_id,
                    db=db,
                )

                auth_router.update_settings(
                    auth_router.SettingsUpdateRequest(allow_ai_contacts_context=False),
                    x_user_id=self.user_id,
                    db=db,
                )

                unauthorized = ai_router.generate(
                    {
                        'type': 'chat',
                        'provider': 'qwen',
                        'data': {
                            'message': '帮我推荐合作人',
                            'allowContactsContext': True,
                        },
                    },
                    x_user_id=self.user_id,
                    db=db,
                )

        self.assertTrue(authorized['success'])
        self.assertTrue(unauthorized['success'])
        self.assertEqual(len(captured_prompts), 2)
        self.assertIn('联系人资料摘要', captured_prompts[0])
        self.assertIn('林知远', captured_prompts[0])
        self.assertIn('苏念', captured_prompts[0])
        self.assertNotIn('联系人资料摘要', captured_prompts[1])
        self.assertIn('用户自己的名片资料', captured_prompts[0])
        self.assertIn('用户自己的名片资料', captured_prompts[1])

    def test_extract_includes_self_profile_context_without_contacts_permission(self):
        with SessionLocal() as db:
            captured_prompts = []

            def fake_call_llm(prompt, system_prompt, provider=None, trace=None):
                captured_prompts.append(prompt)
                return {
                    'choices': [
                        {
                            'message': {
                                'content': '{"name":"测试用户","role":"产品经理","tags":["AI"]}',
                            }
                        }
                    ]
                }

            with patch.object(ai_router, 'call_llm', side_effect=fake_call_llm):
                auth_router.update_settings(
                    auth_router.SettingsUpdateRequest(allow_ai_contacts_context=False),
                    x_user_id=self.user_id,
                    db=db,
                )

                response = ai_router.generate(
                    {
                        'type': 'extract',
                        'provider': 'qwen',
                        'data': {
                            'text': '我最近在做 AI 产品，帮我整理成名片资料',
                            'allowContactsContext': True,
                            'selfProfileDraft': {
                                'bio': '正在打磨 AI 产品和效率工具',
                                'techStack': 'AI, React',
                            },
                        },
                    },
                    x_user_id=self.user_id,
                    db=db,
                )

        self.assertTrue(response['success'])
        self.assertEqual(len(captured_prompts), 1)
        self.assertIn('用户自己的名片资料', captured_prompts[0])
        self.assertIn('正在打磨 AI 产品和效率工具', captured_prompts[0])
        self.assertNotIn('联系人资料摘要', captured_prompts[0])


if __name__ == '__main__':
    unittest.main()
