from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Card, Contact, User, Visitor
from ..schemas import ContactItem, PersonaTag, SettingsSummary, VisitorItem, WorkbenchResponse

router = APIRouter(prefix="/workbench", tags=["workbench"])


def build_persona_tags(tags: list[str]) -> list[PersonaTag]:
    return [
        PersonaTag(label=label, size=max(96, 132 - index * 12))
        for index, label in enumerate(tags[:3])
    ]


def require_user(x_user_id: str | None, db: Session) -> User:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")
    user = db.get(User, x_user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid user")
    return user


@router.get("", response_model=WorkbenchResponse)
def get_workbench(
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> WorkbenchResponse:
    require_user(x_user_id, db)

    default_card = db.scalar(select(Card).where(Card.user_id == x_user_id, Card.is_default.is_(True)))
    if not default_card:
        default_card = db.scalar(select(Card).where(Card.user_id == x_user_id).order_by(Card.created_at.desc()))

    visitors = db.scalars(
        select(Visitor).where(Visitor.owner_user_id == x_user_id).order_by(Visitor.last_visit_at.desc())
    ).all()
    starred_contacts = db.scalars(
        select(Contact).where(Contact.owner_user_id == x_user_id, Contact.starred.is_(True)).order_by(Contact.updated_at.desc())
    ).all()

    weekly_views = db.scalar(select(func.coalesce(func.sum(Visitor.visit_count), 0)).where(Visitor.owner_user_id == x_user_id)) or 0
    visitor_count = db.scalar(select(func.count()).select_from(Visitor).where(Visitor.owner_user_id == x_user_id)) or 0

    raw_tags: list[str] = []
    if default_card and default_card.tech_stack:
        raw_tags.extend([item.strip() for item in default_card.tech_stack.replace("，", ",").split(",") if item.strip()])
    if not raw_tags:
        raw_tags = ["AI", "产品", "SaaS"]

    persona_tags = build_persona_tags(raw_tags)

    default_card_payload = None
    if default_card:
        default_card_payload = {
            "_id": default_card.id,
            "id": default_card.id,
            "name": default_card.name,
            "role": default_card.role,
            "company": default_card.company,
            "bannerUrl": default_card.banner_url,
            "avatarUrl": default_card.avatar_url,
        }

    starred_payload = []
    for contact in starred_contacts[:4]:
        source_card = db.get(Card, contact.target_card_id) if contact.target_card_id else None
        starred_payload.append(
            ContactItem(
                _id=contact.id,
                cardId=(source_card.id if source_card else "") or "",
                name=(source_card.name if source_card else "联系人") or "联系人",
                role=(source_card.role if source_card else "") or "",
                company=(source_card.company if source_card else "") or "",
                avatarUrl=(source_card.avatar_url if source_card else "") or "",
                tags=[],
                starred=contact.starred,
                hasUpdate=contact.has_update,
                updateType=contact.update_type or "",
                updateMessage=contact.update_message or "",
                status=contact.status,
                latestInteractionText=contact.latest_interaction_text or "",
                note=contact.note or "",
            )
        )

    recent_visitors = []
    for visitor in visitors[:3]:
        visit_card = db.get(Card, visitor.card_id)
        recent_visitors.append(
            VisitorItem(
                _id=visitor.id,
                name=(visit_card.name if visit_card else "新访客") or "新访客",
                role=(visit_card.role if visit_card else "名片访客") or "名片访客",
                avatarUrl=(visit_card.avatar_url if visit_card else "") or "",
                source=visitor.source or "名片分享",
                location=(visit_card.location_city if visit_card and visit_card.location_city else "") or "",
                visitDate=visitor.last_visit_at.isoformat() if visitor.last_visit_at else "",
                visitTimeText="刚刚",
                visitCount=visitor.visit_count,
            )
        )

    return WorkbenchResponse(
        defaultCard=default_card_payload,
        weeklyViews=int(weekly_views),
        visitorCount=int(visitor_count),
        personaTags=persona_tags,
        personaSummary=[],
        starredContacts=starred_payload,
        recentVisitors=recent_visitors,
        settingsSummary=SettingsSummary(),
    )
