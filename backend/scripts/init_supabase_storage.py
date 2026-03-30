from __future__ import annotations

import json
import sys
from pathlib import Path
from urllib import error, request

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.config import settings

DEFAULT_BUCKETS = [
    {"id": "card-assets", "name": "card-assets", "public": True},
    {"id": "card-media", "name": "card-media", "public": True},
]


def ensure_bucket(bucket: dict) -> str:
    base_url = settings.supabase_url.rstrip('/')
    req = request.Request(
        f"{base_url}/storage/v1/bucket",
        data=json.dumps(bucket).encode('utf-8'),
        headers={
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=20) as resp:
            return f"created:{bucket['id']}:{resp.status}"
    except error.HTTPError as exc:
        body = exc.read().decode('utf-8', errors='ignore')
        if exc.code == 409 or 'already exists' in body.lower() or 'duplicate' in body.lower():
            return f"exists:{bucket['id']}"
        raise RuntimeError(f"bucket {bucket['id']} failed: {exc.code} {body}") from exc


if __name__ == '__main__':
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise SystemExit('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')

    for bucket in DEFAULT_BUCKETS:
        print(ensure_bucket(bucket))
