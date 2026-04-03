import sys
import unittest
from pathlib import Path
from unittest.mock import patch

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.routers import ai as ai_router


class AiTraceTests(unittest.TestCase):
    def test_generate_chat_returns_trace_timestamps(self):
        with patch.object(ai_router, 'now_ms', side_effect=[1100, 1650]):
            def fake_call_llm(prompt, system_prompt, provider=None, trace=None):
                self.assertEqual(provider, 'qwen')
                self.assertIsNotNone(trace)
                trace['modelRequestStartedAtMs'] = 1180
                trace['modelFirstByteAtMs'] = 1500
                return {
                    'choices': [
                        {
                            'message': {
                                'content': '模型已回复',
                            }
                        }
                    ]
                }

            with patch.object(ai_router, 'call_llm', side_effect=fake_call_llm):
                response = ai_router.generate(
                    {
                        'type': 'chat',
                        'provider': 'qwen',
                        'data': {
                            'message': '你好',
                            'trace': {
                                'traceId': 'trace-1',
                                'frontendClickedAtMs': 1000,
                            },
                        },
                    }
                )

        self.assertTrue(response['success'])
        self.assertEqual(response['result']['reply'], '模型已回复')
        self.assertEqual(
            response['meta']['trace'],
            {
                'traceId': 'trace-1',
                'frontendClickedAtMs': 1000,
                'backendReceivedAtMs': 1100,
                'modelRequestStartedAtMs': 1180,
                'modelFirstByteAtMs': 1500,
                'backendReturnedAtMs': 1650,
                'frontendToBackendMs': 100,
                'backendPrepareMs': 80,
                'modelFirstByteMs': 320,
                'backendReturnMs': 150,
                'backendTotalMs': 550,
            },
        )

    def test_generate_chat_marks_fallback_reply_source(self):
        with patch.object(ai_router, 'call_llm', return_value=None):
            response = ai_router.generate(
                {
                    'type': 'chat',
                    'provider': 'qwen',
                    'data': {
                        'message': '怎么优化我的名片简介',
                    },
                }
            )

        self.assertTrue(response['success'])
        self.assertIn('reply', response['result'])
        self.assertEqual(response['meta'].get('replySource'), 'fallback_rule')
        self.assertFalse(response['meta'].get('modelAnswered'))

    def test_generate_chat_reports_contacts_context_usage(self):
        with patch.object(ai_router, 'get_self_profile_snapshot', return_value={'role': 'AI 产品经理'}), patch.object(
            ai_router,
            'build_self_profile_context',
            return_value='用户自己的名片资料：角色: AI 产品经理',
        ), patch.object(
            ai_router, 'is_contacts_context_authorized', return_value=True
        ), patch.object(
            ai_router,
            'build_contacts_context',
            return_value='联系人资料摘要：林知远 | AI',
        ), patch.object(
            ai_router,
            'call_llm',
            return_value={'choices': [{'message': {'content': '推荐林知远'}}]},
        ):
            response = ai_router.generate(
                {
                    'type': 'chat',
                    'provider': 'qwen',
                    'data': {
                        'message': '帮我推荐一个ai方向的人',
                        'allowContactsContext': True,
                    },
                },
                x_user_id='user_ctx',
                db=None,
            )

        self.assertTrue(response['success'])
        self.assertTrue(response['meta'].get('selfProfileUsed'))
        self.assertTrue(response['meta'].get('contactsContextUsed'))
        self.assertEqual(response['meta'].get('replySource'), 'model')

    def test_generate_chat_falls_back_to_contacts_recommendation(self):
        with patch.object(ai_router, 'is_contacts_context_authorized', return_value=True), patch.object(
            ai_router,
            'build_contacts_context',
            return_value=(
                '联系人资料摘要（用户已明确授权）：\n'
                '1. 林知远 | AI 产品顾问 | 星海科技 | 标签: AI、SaaS\n'
                '2. 苏念 | 机器学习工程师 | 南风数智 | 标签: AI、模型'
            ),
        ), patch.object(
            ai_router,
            'call_llm',
            return_value=None,
        ):
            response = ai_router.generate(
                {
                    'type': 'chat',
                    'provider': 'qwen',
                    'data': {
                        'message': '帮我推荐一个ai方向的人',
                        'allowContactsContext': True,
                    },
                },
                x_user_id='user_ctx',
                db=None,
            )

        self.assertTrue(response['success'])
        self.assertEqual(response['meta'].get('replySource'), 'fallback_rule')
        self.assertFalse(response['meta'].get('modelAnswered'))
        self.assertTrue(response['meta'].get('contactsContextUsed'))
        self.assertIn('林知远', response['result']['reply'])
        self.assertIn('苏念', response['result']['reply'])


if __name__ == '__main__':
    unittest.main()
