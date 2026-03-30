from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Card, Contact, ContactTag, User
from ..schemas import ContactItem, ContactListResponse

router = APIRouter(prefix="/contacts", tags=["contacts"])

UPDATE_TYPES = {"projects", "videos"}


def require_user(x_user_id: str | None, db: Session) -> User:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")
    user = db.get(User, x_user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid user")
    return user


def build_contact_payload(contact: Contact, db: Session) -> ContactItem:
    target_card = db.get(Card, contact.target_card_id) if contact.target_card_id else None
    source_card = db.get(Card, contact.source_card_id) if contact.source_card_id else None
    card = target_card or source_card
    tags = [tag.tag_name for tag in contact.tags]

    return ContactItem(
        _id=contact.id,
        name=(card.name if card else "联系人") or "联系人",
        role=(card.role if card else "") or "",
        company=(card.company if card else "") or "",
        phone=(card.phone if card else "") or "",
        email=(card.email if card else "") or "",
        wechat=(card.wechat if card else "") or "",
        avatarUrl=(card.avatar_url if card else "") or "",
        bannerUrl=(card.banner_url if card else "") or "",
        bio=(card.bio if card else "") or "",
        tags=tags,
        starred=contact.starred,
        hasUpdate=contact.has_update,
        updateType=contact.update_type or "",
        updateMessage=contact.update_message or "",
        status=contact.status,
        latestInteractionText=contact.latest_interaction_text or "",
        note=contact.note or "",
    )


@router.get("", response_model=ContactListResponse)
def list_contacts(
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> ContactListResponse:
    require_user(x_user_id, db)
    contacts = db.scalars(
        select(Contact)
        .options(selectinload(Contact.tags))
        .where(Contact.owner_user_id == x_user_id)
        .order_by(Contact.updated_at.desc())
    ).all()

    items = [build_contact_payload(item, db) for item in contacts]
    pending_requests = [item for item in items if item.status == "pending"]
    active_contacts = [item for item in items if item.status not in {"pending", "rejected"}]
    updated_tips = [item for item in active_contacts if item.hasUpdate and item.updateType in UPDATE_TYPES]

    tag_set = {"全部"}
    for item in active_contacts:
        for tag in item.tags:
            if tag:
                tag_set.add(tag)

    return ContactListResponse(
        contacts=active_contacts,
        pendingRequests=pending_requests,
        updatedTips=updated_tips,
        tags=list(tag_set),
    )


@router.post("/{contact_id}/star", response_model=dict)
def toggle_star_contact(
    contact_id: str,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> dict:
    require_user(x_user_id, db)
    contact = db.scalar(select(Contact).where(Contact.id == contact_id, Contact.owner_user_id == x_user_id))
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    contact.starred = not contact.starred
    db.commit()
    return {"success": True, "contact_id": contact_id, "starred": contact.starred}
