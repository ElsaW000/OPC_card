import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.config import Settings


class AISettingsTests(unittest.TestCase):
    def test_dashscope_api_key_is_loaded_from_official_env_name(self):
        with patch.dict(os.environ, {'DASHSCOPE_API_KEY': 'sk-test-dashscope'}, clear=True):
            settings = Settings(_env_file=None)
            self.assertEqual(settings.dashscope_api_key, 'sk-test-dashscope')

    def test_legacy_qwen_env_aliases_are_not_supported(self):
        with patch.dict(
            os.environ,
            {
                'QWEN_BASE_URL': 'https://legacy.example.com/compatible-mode/v1',
                'QWEN_API_KEY': 'sk-legacy-qwen',
            },
            clear=True,
        ):
            settings = Settings(_env_file=None)
            self.assertEqual(settings.dashscope_base_url, 'https://dashscope.aliyuncs.com/compatible-mode/v1')
            self.assertEqual(settings.dashscope_api_key, '')


if __name__ == '__main__':
    unittest.main()