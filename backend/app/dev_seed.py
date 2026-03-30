from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import (
    Card,
    CardCustomBlock,
    CardProject,
    CardProjectTag,
    CardVideo,
    Contact,
    ContactTag,
    ExchangeRecord,
    Setting,
    User,
    Visitor,
)


def _get_or_create_user(
    db: Session,
    *,
    openid: str,
    nickname: str,
    avatar_url: str,
    phone: str = "",
) -> User:
    user = db.scalar(select(User).where(User.wechat_openid == openid))
    if user:
        return user

    user = User(
        wechat_openid=openid,
        nickname=nickname,
        avatar_url=avatar_url,
        phone=phone or None,
        source="miniapp",
        last_login_at=datetime.utcnow(),
    )
    db.add(user)
    db.flush()
    return user


def _assign_card_data(
    card: Card,
    *,
    template: str,
    title: str,
    is_default: bool,
    name: str,
    name_en: str,
    role: str,
    bio: str,
    company: str,
    location_country: str,
    location_city: str,
    phone: str,
    email: str,
    wechat: str,
    banner_url: str,
    avatar_url: str,
    tech_stack: str,
    years: str,
    products_count: str,
    users_count: str,
    footer_title: str,
    footer_desc: str,
    projects: list[dict] | None,
    videos: list[dict] | None,
    custom_blocks: list[dict] | None,
) -> None:
    card.template = template
    card.title = title
    card.is_default = is_default
    card.name = name
    card.name_en = name_en
    card.role = role
    card.bio = bio
    card.company = company
    card.location_country = location_country
    card.location_city = location_city
    card.phone = phone
    card.email = email
    card.wechat = wechat
    card.banner_url = banner_url
    card.avatar_url = avatar_url
    card.tech_stack = tech_stack
    card.years = years
    card.products_count = products_count
    card.users_count = users_count
    card.footer_title = footer_title
    card.footer_desc = footer_desc
    card.projects = [
        CardProject(
            title=item.get("title", ""),
            description=item.get("description", ""),
            thumbnail_url=item.get("thumbnail_url", ""),
            link_url=item.get("link_url", ""),
            github_url=item.get("github_url", ""),
            sort_order=index,
            tags=[CardProjectTag(tag_name=tag) for tag in item.get("tags", []) if tag],
        )
        for index, item in enumerate(projects or [])
    ]
    card.videos = [
        CardVideo(
            title=item.get("title", ""),
            thumbnail_url=item.get("thumbnail_url", ""),
            link_url=item.get("link_url", ""),
            views_text=item.get("views_text", ""),
            duration_text=item.get("duration_text", ""),
            sort_order=index,
        )
        for index, item in enumerate(videos or [])
    ]
    card.custom_blocks = [
        CardCustomBlock(
            title=item.get("title", ""),
            content=item.get("content", ""),
            sort_order=index,
        )
        for index, item in enumerate(custom_blocks or [])
    ]


def _get_or_create_card(
    db: Session,
    *,
    user_id: str,
    title: str,
    name: str,
    name_en: str,
    role: str,
    bio: str,
    company: str,
    location_country: str,
    location_city: str,
    phone: str,
    email: str,
    wechat: str,
    banner_url: str,
    avatar_url: str,
    tech_stack: str,
    years: str,
    products_count: str,
    users_count: str,
    footer_title: str,
    footer_desc: str,
    template: str = "universal",
    is_default: bool = False,
    projects: list[dict] | None = None,
    videos: list[dict] | None = None,
    custom_blocks: list[dict] | None = None,
) -> Card:
    card = db.scalar(select(Card).where(Card.user_id == user_id, Card.title == title))
    if card is None and is_default:
        card = db.scalar(select(Card).where(Card.user_id == user_id, Card.is_default.is_(True)))
    if card is None and not is_default:
        card = db.scalar(select(Card).where(Card.user_id == user_id, Card.is_default.is_(False), Card.title == title))

    if card:
        _assign_card_data(
            card,
            template=template,
            title=title,
            is_default=is_default,
            name=name,
            name_en=name_en,
            role=role,
            bio=bio,
            company=company,
            location_country=location_country,
            location_city=location_city,
            phone=phone,
            email=email,
            wechat=wechat,
            banner_url=banner_url,
            avatar_url=avatar_url,
            tech_stack=tech_stack,
            years=years,
            products_count=products_count,
            users_count=users_count,
            footer_title=footer_title,
            footer_desc=footer_desc,
            projects=projects,
            videos=videos,
            custom_blocks=custom_blocks,
        )
        db.flush()
        return card

    card = Card(user_id=user_id)
    _assign_card_data(
        card,
        template=template,
        title=title,
        is_default=is_default,
        name=name,
        name_en=name_en,
        role=role,
        bio=bio,
        company=company,
        location_country=location_country,
        location_city=location_city,
        phone=phone,
        email=email,
        wechat=wechat,
        banner_url=banner_url,
        avatar_url=avatar_url,
        tech_stack=tech_stack,
        years=years,
        products_count=products_count,
        users_count=users_count,
        footer_title=footer_title,
        footer_desc=footer_desc,
        projects=projects,
        videos=videos,
        custom_blocks=custom_blocks,
    )
    db.add(card)
    db.flush()
    return card


def _ensure_settings(db: Session, user_id: str) -> None:
    settings = db.scalar(select(Setting).where(Setting.user_id == user_id))
    if settings:
        return
    db.add(
        Setting(
            user_id=user_id,
            ai_tone="\u4e13\u4e1a\u4e14\u53cb\u597d",
            public_dynamics=True,
            privacy_mode="\u4ea4\u6362\u540e\u53ef\u89c1",
            blacklist_json="[]",
        )
    )
    db.flush()


def _ensure_contacts(db: Session, owner_user_id: str, owner_card: Card, sample_cards: list[Card]) -> None:
    contact_count = db.scalar(select(func.count()).select_from(Contact).where(Contact.owner_user_id == owner_user_id)) or 0
    if contact_count:
        return

    samples = [
        {
            "card": sample_cards[0],
            "status": "active",
            "starred": True,
            "has_update": True,
            "update_type": "projects",
            "update_message": "\u6700\u8fd1\u65b0\u589e\u4e86\u4e00\u4e2a AI \u5e94\u7528\u9879\u76ee",
            "latest": "\u6628\u5929\u4ea4\u6362\u4e86\u540d\u7247",
            "tags": ["AI", "\u4ea7\u54c1"],
        },
        {
            "card": sample_cards[1],
            "status": "active",
            "starred": False,
            "has_update": False,
            "update_type": "",
            "update_message": "",
            "latest": "2\u5929\u524d\u4ea4\u6362\u4e86\u540d\u7247",
            "tags": ["Flutter", "\u51fa\u6d77"],
        },
        {
            "card": sample_cards[2],
            "status": "active",
            "starred": True,
            "has_update": True,
            "update_type": "videos",
            "update_message": "\u521a\u66f4\u65b0\u4e86\u4e00\u6761\u6f14\u793a\u89c6\u9891",
            "latest": "\u672c\u5468\u6709\u65b0\u52a8\u6001",
            "tags": ["SaaS", "\u589e\u957f"],
        },
    ]

    for item in samples:
        db.add(
            Contact(
                owner_user_id=owner_user_id,
                contact_user_id=item["card"].user_id,
                source_card_id=owner_card.id,
                target_card_id=item["card"].id,
                status=item["status"],
                starred=item["starred"],
                has_update=item["has_update"],
                update_type=item["update_type"],
                update_message=item["update_message"],
                latest_interaction_text=item["latest"],
                tags=[ContactTag(tag_name=tag) for tag in item["tags"]],
            )
        )
    db.flush()


def _ensure_visitors(db: Session, owner_user_id: str, sample_cards: list[Card]) -> None:
    visitor_count = db.scalar(select(func.count()).select_from(Visitor).where(Visitor.owner_user_id == owner_user_id)) or 0
    if visitor_count:
        return

    now = datetime.utcnow()
    samples = [
        {"card": sample_cards[0], "source": "\u626b\u7801\u4ea4\u6362", "visit_count": 3, "delta": timedelta(minutes=10)},
        {"card": sample_cards[1], "source": "\u540d\u7247\u5206\u4eab", "visit_count": 2, "delta": timedelta(hours=4)},
        {"card": sample_cards[2], "source": "\u5fae\u4fe1\u8f6c\u53d1", "visit_count": 1, "delta": timedelta(days=1)},
    ]

    for item in samples:
        last_visit_at = now - item["delta"]
        db.add(
            Visitor(
                owner_user_id=owner_user_id,
                visitor_user_id=item["card"].user_id,
                card_id=item["card"].id,
                source=item["source"],
                visit_count=item["visit_count"],
                first_visit_at=last_visit_at,
                last_visit_at=last_visit_at,
            )
        )
    db.flush()


def _ensure_exchange_records(db: Session, owner_user_id: str, owner_card: Card, sample_cards: list[Card]) -> None:
    exchange_count = db.scalar(select(func.count()).select_from(ExchangeRecord).where(ExchangeRecord.requester_user_id == owner_user_id)) or 0
    if exchange_count:
        return

    for item in sample_cards[:2]:
        db.add(
            ExchangeRecord(
                requester_user_id=owner_user_id,
                target_user_id=item.user_id,
                requester_card_id=owner_card.id,
                target_card_id=item.id,
                status="accepted",
                channel="qrcode",
            )
        )
    db.flush()


def ensure_dev_demo_data(db: Session, user: User) -> None:
    owner_card_count = db.scalar(select(func.count()).select_from(Card).where(Card.user_id == user.id)) or 0
    if owner_card_count:
        _ensure_settings(db, user.id)
        db.commit()
        return

    owner_card = _get_or_create_card(
        db,
        user_id=user.id,
        title="\u6280\u672f\u5f00\u53d1\u540d\u7247",
        name="\u9648\u5c0f\u72ec\u7acb",
        name_en="Independent Chen",
        role="OPC \u521b\u59cb\u4eba / \u5168\u6808\u5de5\u7a0b\u5e08",
        bio="\u4e00\u540d\u4e13\u6ce8\u4e8e\u6784\u5efa AI \u5de5\u5177\u4e0e\u6548\u7387\u4ea7\u54c1\u7684\u72ec\u7acb\u5f00\u53d1\u8005\uff0c\u6301\u7eed\u6253\u78e8\u4ea7\u54c1\u4f53\u9a8c\uff0c\u5e76\u628a\u590d\u6742\u903b\u8f91\u8f6c\u5316\u6210\u76f4\u89c2\u7684\u754c\u9762\u3002",
        company="\u58f9\u5e2deSeat",
        location_country="\u4e2d\u56fd",
        location_city="\u6df1\u5733",
        phone="13800138000",
        email="chen@example.com",
        wechat="indie-chen",
        banner_url="https://images.unsplash.com/photo-1647247743538-0137d6a8a268?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
        avatar_url="https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        tech_stack="AI, React, SaaS",
        years="8+",
        products_count="12",
        users_count="25k",
        footer_title="\u8054\u7cfb\u6211",
        footer_desc="\u6b22\u8fce\u901a\u8fc7\u4ee5\u4e0b\u65b9\u5f0f\u5efa\u7acb\u8fde\u63a5\uff0c\u6211\u4f1a\u5c3d\u5feb\u56de\u590d\u3002",
        template="developer",
        is_default=True,
        projects=[
            {
                "title": "CodeFlow AI",
                "description": "\u5e2e\u52a9\u72ec\u7acb\u5f00\u53d1\u8005\u901a\u8fc7\u81ea\u7136\u8bed\u8a00\u5feb\u901f\u751f\u6210\u754c\u9762\u4e0e\u7ec4\u4ef6\u7684 AI \u5de5\u4f5c\u6d41\u3002",
                "thumbnail_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
                "link_url": "https://codeflow.example.com",
                "github_url": "https://github.com/example/codeflow",
                "tags": ["AI", "React", "SaaS"],
            },
            {
                "title": "SparkBoard",
                "description": "\u9762\u5411\u5c0f\u56e2\u961f\u7684\u8f7b\u91cf\u4efb\u52a1\u4e0e\u77e5\u8bc6\u534f\u4f5c\u4ea7\u54c1\u3002",
                "thumbnail_url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
                "link_url": "https://sparkboard.example.com",
                "github_url": "https://github.com/example/sparkboard",
                "tags": ["\u6548\u7387", "\u534f\u4f5c"],
            },
        ],
        videos=[
            {
                "title": "5 \u5206\u949f\u770b\u61c2 CodeFlow AI",
                "thumbnail_url": "https://images.unsplash.com/photo-1647247743538-0137d6a8a268?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=900",
                "link_url": "https://video.example.com/codeflow",
                "views_text": "12k",
                "duration_text": "01:45",
            }
        ],
        custom_blocks=[
            {"title": "MBTI", "content": "INTJ"},
            {"title": "\u5173\u6ce8\u65b9\u5411", "content": "AI \u5de5\u5177\u3001\u6548\u7387\u4ea7\u54c1\u3001\u4e2a\u4eba\u5de5\u4f5c\u6d41"},
        ],
    )

    _get_or_create_card(
        db,
        user_id=user.id,
        title="\u5546\u52a1\u5408\u4f5c\u540d\u7247",
        name="\u9648\u5c0f\u72ec\u7acb",
        name_en="Independent Chen",
        role="\u4ea7\u54c1\u5408\u4f5c / \u5546\u52a1\u54a8\u8be2",
        bio="\u805a\u7126 AI \u4e0e\u6548\u7387\u4ea7\u54c1\u7684\u5546\u4e1a\u5316\u9a8c\u8bc1\u3001\u5408\u4f5c\u62d3\u5c55\u4e0e\u54c1\u724c\u8054\u52a8\u3002",
        company="\u58f9\u5e2deSeat",
        location_country="\u4e2d\u56fd",
        location_city="\u6df1\u5733",
        phone="13800138000",
        email="biz@example.com",
        wechat="eseat-biz",
        banner_url="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
        avatar_url="https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        tech_stack="\u5546\u4e1a\u5316, \u5408\u4f5c, \u589e\u957f",
        years="5+",
        products_count="6",
        users_count="80k",
        footer_title="\u5408\u4f5c\u8054\u7cfb",
        footer_desc="\u6b22\u8fce\u4ea4\u6d41\u54c1\u724c\u5408\u4f5c\u3001\u6e20\u9053\u8054\u52a8\u4e0e\u5546\u52a1\u54a8\u8be2\u3002",
        template="boss",
        is_default=False,
    )

    sample_people = [
        {
            "openid": "wx_demo_contact_lin",
            "nickname": "\u6797\u77e5\u8fdc",
            "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300",
            "phone": "13900001111",
            "card": {
                "title": "AI \u4ea7\u54c1\u540d\u7247",
                "name": "\u6797\u77e5\u8fdc",
                "name_en": "Lynn Lin",
                "role": "\u4ea7\u54c1\u7ecf\u7406 / AI \u5e94\u7528\u8bbe\u8ba1",
                "bio": "\u4e13\u6ce8 AI \u5e94\u7528\u4ea7\u54c1\u8bbe\u8ba1\uff0c\u64c5\u957f\u4ece 0 \u5230 1 \u6253\u78e8\u7528\u6237\u4f53\u9a8c\u3002",
                "company": "Morning Labs",
                "location_country": "\u4e2d\u56fd",
                "location_city": "\u676d\u5dde",
                "phone": "13900001111",
                "email": "lynn@example.com",
                "wechat": "lin-lynn",
                "banner_url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
                "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300",
                "tech_stack": "AI, \u4ea7\u54c1, \u7528\u6237\u7814\u7a76",
                "years": "6+",
                "products_count": "9",
                "users_count": "60k",
                "footer_title": "\u8054\u7cfb Lynn",
                "footer_desc": "\u6b22\u8fce\u804a AI \u4ea7\u54c1\u4e0e\u589e\u957f\u3002",
                "template": "universal",
            },
        },
        {
            "openid": "wx_demo_contact_su",
            "nickname": "\u82cf\u5ff5",
            "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300",
            "phone": "13900002222",
            "card": {
                "title": "\u51fa\u6d77\u589e\u957f\u540d\u7247",
                "name": "\u82cf\u5ff5",
                "name_en": "Nina Su",
                "role": "\u589e\u957f\u8d1f\u8d23\u4eba / \u51fa\u6d77\u8fd0\u8425",
                "bio": "\u5173\u6ce8 SaaS \u51fa\u6d77\u3001\u589e\u957f\u5b9e\u9a8c\u4e0e\u6e20\u9053\u62d3\u5c55\u3002",
                "company": "Wave Studio",
                "location_country": "\u65b0\u52a0\u5761",
                "location_city": "Singapore",
                "phone": "13900002222",
                "email": "nina@example.com",
                "wechat": "nina-wave",
                "banner_url": "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
                "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300",
                "tech_stack": "SaaS, \u589e\u957f, \u51fa\u6d77",
                "years": "7+",
                "products_count": "14",
                "users_count": "120k",
                "footer_title": "\u8054\u7cfb Nina",
                "footer_desc": "\u6b22\u8fce\u4ea4\u6d41\u589e\u957f\u4e0e\u51fa\u6d77\u5408\u4f5c\u3002",
                "template": "boss",
            },
        },
        {
            "openid": "wx_demo_contact_zhao",
            "nickname": "\u8d75\u4e00\u5e06",
            "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300",
            "phone": "13900003333",
            "card": {
                "title": "Flutter \u5f00\u53d1\u540d\u7247",
                "name": "\u8d75\u4e00\u5e06",
                "name_en": "Evan Zhao",
                "role": "Flutter \u5f00\u53d1 / \u72ec\u7acb\u521b\u4f5c\u8005",
                "bio": "\u64c5\u957f\u8de8\u7aef\u5e94\u7528\u5f00\u53d1\uff0c\u6700\u8fd1\u5728\u505a AI + \u79fb\u52a8\u6548\u7387\u5de5\u5177\u3002",
                "company": "Indie Works",
                "location_country": "\u4e2d\u56fd",
                "location_city": "\u6210\u90fd",
                "phone": "13900003333",
                "email": "evan@example.com",
                "wechat": "evan-flutter",
                "banner_url": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
                "avatar_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300",
                "tech_stack": "Flutter, AI, \u79fb\u52a8\u7aef",
                "years": "5+",
                "products_count": "7",
                "users_count": "30k",
                "footer_title": "\u8054\u7cfb Evan",
                "footer_desc": "\u6b22\u8fce\u4e00\u8d77\u804a Flutter \u548c\u72ec\u7acb\u4ea7\u54c1\u3002",
                "template": "developer",
            },
        },
    ]

    sample_cards: list[Card] = []
    for item in sample_people:
        sample_user = _get_or_create_user(
            db,
            openid=item["openid"],
            nickname=item["nickname"],
            avatar_url=item["avatar"],
            phone=item["phone"],
        )
        sample_cards.append(
            _get_or_create_card(
                db,
                user_id=sample_user.id,
                is_default=True,
                projects=[],
                videos=[],
                custom_blocks=[],
                **item["card"],
            )
        )

    _ensure_settings(db, user.id)
    _ensure_contacts(db, user.id, owner_card, sample_cards)
    _ensure_visitors(db, user.id, sample_cards)
    _ensure_exchange_records(db, user.id, owner_card, sample_cards)
    db.commit()
