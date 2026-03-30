from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Card, User
from ..schemas import CardListResponse, CardSummary, CardUpsertRequest

router = APIRouter(prefix="/cards", tags=["cards"])


def require_user(x_user_id: str | None, db: Session) -> User:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")
    user = db.get(User, x_user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid user")
    return user


def to_summary(card: Card) -> CardSummary:
    return CardSummary(
        id=card.id,
        title=card.title,
        template=card.template,
        is_default=card.is_default,
        name=card.name,
        role=card.role,
        company=card.company,
        banner_url=card.banner_url,
        avatar_url=card.avatar_url,
    )


@router.get("", response_model=CardListResponse)
def list_cards(
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> CardListResponse:
    require_user(x_user_id, db)
    items = db.scalars(select(Card).where(Card.user_id == x_user_id).order_by(Card.created_at.desc())).all()
    return CardListResponse(items=[to_summary(item) for item in items])


@router.post("", response_model=dict)
def create_card(
    payload: CardUpsertRequest,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> dict:
    require_user(x_user_id, db)

    has_default = db.scalar(select(Card).where(Card.user_id == x_user_id, Card.is_default.is_(True)))
    card = Card(
        user_id=x_user_id,
        template=payload.template,
        title=payload.title,
        is_default=payload.is_default or not bool(has_default),
        name=payload.name,
        name_en=payload.name_en,
        role=payload.role,
        bio=payload.bio,
        company=payload.company,
        business=payload.business,
        cooperation=payload.cooperation,
        location_country=payload.location_country,
        location_city=payload.location_city,
        wechat=payload.wechat,
        phone=payload.phone,
        email=payload.email,
        github_url=payload.github_url,
        twitter_url=payload.twitter_url,
        banner_url=payload.banner_url,
        avatar_url=payload.avatar_url,
        years=payload.years,
        tech_stack=payload.tech_stack,
        products_count=payload.products_count,
        users_count=payload.users_count,
        footer_title=payload.footer_title,
        footer_desc=payload.footer_desc,
    )
    if card.is_default:
        for item in db.scalars(select(Card).where(Card.user_id == x_user_id)).all():
            item.is_default = False
    db.add(card)
    db.commit()
    db.refresh(card)
    return {"success": True, "card_id": card.id}


@router.put("/{card_id}", response_model=dict)
def update_card(
    card_id: str,
    payload: CardUpsertRequest,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> dict:
    require_user(x_user_id, db)
    card = db.scalar(select(Card).where(Card.id == card_id, Card.user_id == x_user_id))
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    for field in [
        "template", "title", "name", "name_en", "role", "bio", "company", "business",
        "cooperation", "location_country", "location_city", "wechat", "phone", "email",
        "github_url", "twitter_url", "banner_url", "avatar_url", "years", "tech_stack",
        "products_count", "users_count", "footer_title", "footer_desc",
    ]:
        setattr(card, field, getattr(payload, field))

    if payload.is_default:
        for item in db.scalars(select(Card).where(Card.user_id == x_user_id)).all():
            item.is_default = False
        card.is_default = True

    db.commit()
    return {"success": True, "card_id": card.id}


@router.delete("/{card_id}", response_model=dict)
def delete_card(
    card_id: str,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> dict:
    require_user(x_user_id, db)
    card = db.scalar(select(Card).where(Card.id == card_id, Card.user_id == x_user_id))
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    own_cards = db.scalars(select(Card).where(Card.user_id == x_user_id)).all()
    if len(own_cards) <= 1:
        raise HTTPException(status_code=400, detail="At least one card must remain")

    was_default = card.is_default
    db.delete(card)
    db.flush()

    if was_default:
        next_card = db.scalar(select(Card).where(Card.user_id == x_user_id).order_by(Card.created_at.desc()))
        if next_card:
            next_card.is_default = True

    db.commit()
    return {"success": True, "card_id": card_id}


@router.post("/{card_id}/set-default", response_model=dict)
def set_default_card(
    card_id: str,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> dict:
    require_user(x_user_id, db)
    cards = db.scalars(select(Card).where(Card.user_id == x_user_id)).all()
    target = None
    for item in cards:
        is_target = item.id == card_id
        item.is_default = is_target
        if is_target:
            target = item
    if not target:
        raise HTTPException(status_code=404, detail="Card not found")
    db.commit()
    return {"success": True, "card_id": card_id}


@router.get("/{card_id}/view", response_model=dict)
def view_card(card_id: str, db: Session = Depends(get_db)) -> dict:
    card = db.get(Card, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return {
        "success": True,
        "data": {
            "_id": card.id,
            "template": card.template,
            "title": card.title,
            "isDefault": card.is_default,
            "name": card.name,
            "nameEn": card.name_en,
            "role": card.role,
            "bio": card.bio,
            "company": card.company,
            "business": card.business,
            "cooperation": card.cooperation,
            "locationCountry": card.location_country,
            "locationCity": card.location_city,
            "wechat": card.wechat,
            "phone": card.phone,
            "email": card.email,
            "githubUrl": card.github_url,
            "twitterUrl": card.twitter_url,
            "bannerUrl": card.banner_url,
            "avatarUrl": card.avatar_url,
            "years": card.years,
            "techStack": card.tech_stack,
            "products": card.products_count,
            "users": card.users_count,
            "footerTitle": card.footer_title,
            "footerDesc": card.footer_desc,
            "projects": [],
            "videos": [],
            "customCards": [],
        },
    }