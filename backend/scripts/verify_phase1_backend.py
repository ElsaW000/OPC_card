from __future__ import annotations

import json
import sys
from pathlib import Path
from urllib import request

from sqlalchemy import inspect, select, text

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.config import settings
from app.database import SessionLocal, engine
from app.models import Card
from app.routers.auth import wechat_login
from app.routers.cards import create_card, view_card
from app.schemas import CardCustomBlockPayload, CardProjectPayload, CardUpsertRequest, CardVideoPayload, WechatLoginRequest

REQUIRED_TABLES = {
    'users',
    'cards',
    'card_projects',
    'card_project_tags',
    'card_videos',
    'card_custom_blocks',
    'contacts',
    'contact_tags',
    'visitors',
    'exchange_records',
    'settings',
    'suggestions',
}
REQUIRED_BUCKETS = {'card-assets', 'card-media'}


def fetch_buckets() -> list[str]:
    base_url = settings.supabase_url.rstrip('/')
    req = request.Request(
        f"{base_url}/storage/v1/bucket",
        headers={
            'apikey': settings.supabase_service_role_key,
            'Authorization': f'Bearer {settings.supabase_service_role_key}',
        },
        method='GET',
    )
    with request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    return [item.get('id', '') for item in data]


def main() -> None:
    with engine.connect() as conn:
        conn.execute(text('select 1'))

    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    missing_tables = sorted(REQUIRED_TABLES - tables)
    if missing_tables:
        raise SystemExit(f'missing tables: {missing_tables}')

    buckets = set(fetch_buckets())
    missing_buckets = sorted(REQUIRED_BUCKETS - buckets)
    if missing_buckets:
        raise SystemExit(f'missing buckets: {missing_buckets}')

    with SessionLocal() as db:
        login = wechat_login(WechatLoginRequest(code='dev-code'), db)
        payload = CardUpsertRequest(
            template='developer',
            title='????',
            name='????',
            role='?????',
            company='??eSeat',
            projects=[
                CardProjectPayload(
                    title='????',
                    description='????????',
                    thumbnail_url='https://example.com/project.png',
                    link_url='https://example.com/project',
                    github_url='https://github.com/example/project',
                    tags=['AI', 'SaaS'],
                )
            ],
            videos=[
                CardVideoPayload(
                    title='????',
                    thumbnail_url='https://example.com/video.png',
                    link_url='https://example.com/video',
                    views_text='2.4k',
                    duration_text='02:30',
                )
            ],
            custom_cards=[CardCustomBlockPayload(title='???', content='??: verify')],
        )
        created = create_card(payload, login.user_id, db)
        card_id = created['card_id']
        viewed = view_card(card_id, db)['data']
        assert viewed['projects'][0]['title'] == '????'
        assert viewed['videos'][0]['title'] == '????'
        assert viewed['customCards'][0]['title'] == '???'

        card = db.scalar(select(Card).where(Card.id == card_id))
        if card is not None:
            db.delete(card)
            db.commit()

    print('phase1_backend_verified')
    print('tables_ok', len(REQUIRED_TABLES))
    print('buckets_ok', sorted(REQUIRED_BUCKETS))


if __name__ == '__main__':
    main()
