from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Card, Contact, ContactTag, ExchangeRecord, User
from ..schemas import ContactItem, ContactListResponse


class ExchangeRequestBody(BaseModel):
    target_card_id: str

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
        cardId=(card.id if card else "") or "",
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
    active_contacts = [item for item in items if item.status not in {"pending", "pending_sent", "rejected"}]
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


@router.post("/exchange-request", response_model=dict)
def create_exchange_request(
    body: ExchangeRequestBody,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> dict:
    requester = require_user(x_user_id, db)

    target_card = db.get(Card, body.target_card_id)
    if not target_card:
        raise HTTPException(status_code=404, detail="Target card not found")
    if target_card.user_id == x_user_id:
        raise HTTPException(status_code=400, detail="Cannot exchange with yourself")

    # Find requester's default card
    requester_card = db.scalar(
        select(Card).where(Card.user_id == x_user_id, Card.is_default == True)
    ) or db.scalar(select(Card).where(Card.user_id == x_user_id))

    # Avoid duplicate pending requests
    existing = db.scalar(
        select(Contact).where(
            Contact.owner_user_id == x_user_id,
            Contact.contact_user_id == target_card.user_id,
            Contact.status.in_(["pending_sent", "pending"]),
        )
    )
    if existing:
        return {"success": True, "message": "Request already sent"}

    # Create pending_sent for requester
    requester_contact = Contact(
        owner_user_id=x_user_id,
        contact_user_id=target_card.user_id,
        source_card_id=requester_card.id if requester_card else None,
        target_card_id=target_card.id,
        status="pending_sent",
        latest_interaction_text="已发送交换请求",
    )
    db.add(requester_contact)

    # Create pending for target user
    target_contact = Contact(
        owner_user_id=target_card.user_id,
        contact_user_id=x_user_id,
        source_card_id=target_card.id,
        target_card_id=requester_card.id if requester_card else None,
        status="pending",
        latest_interaction_text="收到交换名片请求",
    )
    db.add(target_contact)

    # Write ExchangeRecord
    exchange_record = ExchangeRecord(
        requester_user_id=x_user_id,
        target_user_id=target_card.user_id,
        requester_card_id=requester_card.id if requester_card else None,
        target_card_id=target_card.id,
        status="pending",
        channel="qrcode",
    )
    db.add(exchange_record)

    db.commit()

    return {"success": True, "message": "Exchange request sent"}


@router.post("/{contact_id}/approve", response_model=dict)
def approve_contact(
    contact_id: str,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> dict:
    require_user(x_user_id, db)
    contact = db.scalar(
        select(Contact).where(Contact.id == contact_id, Contact.owner_user_id == x_user_id, Contact.status == "pending")
    )
    if not contact:
        raise HTTPException(status_code=404, detail="Pending request not found")

    contact.status = "active"
    contact.latest_interaction_text = "已通过交换请求"

    # Also activate the reverse pending_sent contact
    reverse = db.scalar(
        select(Contact).where(
            Contact.owner_user_id == contact.contact_user_id,
            Contact.contact_user_id == x_user_id,
            Contact.status == "pending_sent",
        )
    )
    if reverse:
        reverse.status = "active"
        reverse.latest_interaction_text = "交换成功"

    exchange_record = db.scalar(
        select(ExchangeRecord).where(
            ExchangeRecord.requester_user_id == contact.contact_user_id,
            ExchangeRecord.target_user_id == x_user_id,
            ExchangeRecord.status == "pending",
        ).order_by(ExchangeRecord.created_at.desc())
    )
    if exchange_record:
        exchange_record.status = "approved"

    db.commit()
    return {"success": True, "contact_id": contact_id}


@router.post("/{contact_id}/reject", response_model=dict)
def reject_contact(
    contact_id: str,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> dict:
    require_user(x_user_id, db)
    contact = db.scalar(
        select(Contact).where(Contact.id == contact_id, Contact.owner_user_id == x_user_id, Contact.status == "pending")
    )
    if not contact:
        raise HTTPException(status_code=404, detail="Pending request not found")

    contact.status = "rejected"
    contact.latest_interaction_text = "已拒绝交换请求"

    reverse = db.scalar(
        select(Contact).where(
            Contact.owner_user_id == contact.contact_user_id,
            Contact.contact_user_id == x_user_id,
            Contact.status == "pending_sent",
        )
    )
    if reverse:
        reverse.status = "rejected"
        reverse.latest_interaction_text = "交换请求被拒绝"

    exchange_record = db.scalar(
        select(ExchangeRecord).where(
            ExchangeRecord.requester_user_id == contact.contact_user_id,
            ExchangeRecord.target_user_id == x_user_id,
            ExchangeRecord.status == "pending",
        ).order_by(ExchangeRecord.created_at.desc())
    )
    if exchange_record:
        exchange_record.status = "rejected"

    db.commit()
    return {"success": True, "contact_id": contact_id}
