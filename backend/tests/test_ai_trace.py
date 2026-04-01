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


if __name__ == '__main__':
    unittest.main()