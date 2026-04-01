from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Card, User, Visitor
from ..schemas import VisitorItem, VisitorListResponse, VisitorRecordRequest, VisitorRecordResponse

router = APIRouter(prefix="/visitors", tags=["visitors"])


def require_user(x_user_id: str | None, db: Session) -> User:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")
    user = db.get(User, x_user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid user")
    return user


def format_visit_time(last_visit_at: datetime | None) -> str:
    if not last_visit_at:
        return "刚刚"
    now = datetime.utcnow()
    diff = now - last_visit_at
    minutes = int(diff.total_seconds() // 60)
    if minutes <= 1:
        return "刚刚"
    if minutes < 60:
        return f"{minutes}分钟前"
    hours = minutes // 60
    if hours < 24:
        return f"{hours}小时前"
    return f"{last_visit_at.month}月{last_visit_at.day}日"


@router.get("", response_model=VisitorListResponse)
def list_visitors(
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> VisitorListResponse:
    require_user(x_user_id, db)
    visitors = db.scalars(
        select(Visitor)
        .where(Visitor.owner_user_id == x_user_id)
        .order_by(Visitor.last_visit_at.desc())
    ).all()

    items: list[VisitorItem] = []
    for item in visitors:
        card = db.get(Card, item.card_id)
        items.append(
            VisitorItem(
                _id=item.id,
                name=(card.name if card else "新访客") or "新访客",
                role=(card.role if card else "名片访客") or "名片访客",
                avatarUrl=(card.avatar_url if card else "") or "",
                source=item.source or "名片分享",
                location=(card.location_city if card and card.location_city else "") or "",
                visitDate=item.last_visit_at.isoformat() if item.last_visit_at else "",
                visitTimeText=format_visit_time(item.last_visit_at),
                visitCount=item.visit_count,
            )
        )

    return VisitorListResponse(visitors=items)


@router.post("/record", response_model=VisitorRecordResponse)
def record_visitor(
    body: VisitorRecordRequest,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> VisitorRecordResponse:
    # Card must exist
    card = db.get(Card, body.card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    # visitor_user_id may be None if the viewer is not logged in
    viewer_user_id = x_user_id if x_user_id else None

    # Upsert: same viewer + same card => increment visit_count
    existing = db.scalar(
        select(Visitor).where(
            Visitor.card_id == body.card_id,
            Visitor.visitor_user_id == viewer_user_id,
        )
    )
    if existing:
        existing.visit_count += 1
        existing.last_visit_at = datetime.utcnow()
        existing.source = body.source or existing.source
        db.commit()
        return VisitorRecordResponse(visitor_id=existing.id)

    visitor = Visitor(
        owner_user_id=card.user_id,
        visitor_user_id=viewer_user_id,
        card_id=body.card_id,
        source=body.source,
    )
    db.add(visitor)
    db.commit()
    return VisitorRecordResponse(visitor_id=visitor.id)
