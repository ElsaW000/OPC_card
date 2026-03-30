from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def gen_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:16]}"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: gen_id("user"))
    wechat_openid: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    union_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    nickname: Mapped[str | None] = mapped_column(String(128), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    source: Mapped[str] = mapped_column(String(64), default="miniapp")
    app_user_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    cards: Mapped[list["Card"]] = relationship(back_populates="user")
    settings: Mapped[Setting | None] = relationship(back_populates="user", uselist=False)


class Card(Base):
    __tablename__ = "cards"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: gen_id("card"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    template: Mapped[str] = mapped_column(String(32), default="universal")
    title: Mapped[str] = mapped_column(String(128), default="")
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    name: Mapped[str] = mapped_column(String(128))
    name_en: Mapped[str] = mapped_column(String(128), default="")
    role: Mapped[str] = mapped_column(String(255), default="")
    bio: Mapped[str] = mapped_column(Text, default="")
    company: Mapped[str] = mapped_column(String(255), default="")
    business: Mapped[str] = mapped_column(String(255), default="")
    cooperation: Mapped[str] = mapped_column(String(255), default="")
    location_country: Mapped[str] = mapped_column(String(64), default="")
    location_city: Mapped[str] = mapped_column(String(64), default="")
    wechat: Mapped[str] = mapped_column(String(128), default="")
    phone: Mapped[str] = mapped_column(String(32), default="")
    email: Mapped[str] = mapped_column(String(255), default="")
    github_url: Mapped[str] = mapped_column(Text, default="")
    twitter_url: Mapped[str] = mapped_column(Text, default="")
    banner_url: Mapped[str] = mapped_column(Text, default="")
    avatar_url: Mapped[str] = mapped_column(Text, default="")
    years: Mapped[str] = mapped_column(String(32), default="")
    tech_stack: Mapped[str] = mapped_column(Text, default="")
    products_count: Mapped[str] = mapped_column(String(32), default="")
    users_count: Mapped[str] = mapped_column(String(32), default="")
    footer_title: Mapped[str] = mapped_column(String(128), default="")
    footer_desc: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="cards")
    projects: Mapped[list["CardProject"]] = relationship(back_populates="card", cascade="all, delete-orphan")
    videos: Mapped[list["CardVideo"]] = relationship(back_populates="card", cascade="all, delete-orphan")
    custom_blocks: Mapped[list["CardCustomBlock"]] = relationship(back_populates="card", cascade="all, delete-orphan")


class CardProject(Base):
    __tablename__ = "card_projects"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: gen_id("project"))
    card_id: Mapped[str] = mapped_column(ForeignKey("cards.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(128))
    description: Mapped[str] = mapped_column(Text, default="")
    thumbnail_url: Mapped[str] = mapped_column(Text, default="")
    link_url: Mapped[str] = mapped_column(Text, default="")
    github_url: Mapped[str] = mapped_column(Text, default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    card: Mapped[Card] = relationship(back_populates="projects")
    tags: Mapped[list["CardProjectTag"]] = relationship(back_populates="project", cascade="all, delete-orphan")


class CardProjectTag(Base):
    __tablename__ = "card_project_tags"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: gen_id("project_tag"))
    project_id: Mapped[str] = mapped_column(ForeignKey("card_projects.id", ondelete="CASCADE"), index=True)
    tag_name: Mapped[str] = mapped_column(String(64))

    project: Mapped[CardProject] = relationship(back_populates="tags")


class CardVideo(Base):
    __tablename__ = "card_videos"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: gen_id("video"))
    card_id: Mapped[str] = mapped_column(ForeignKey("cards.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(128))
    thumbnail_url: Mapped[str] = mapped_column(Text, default="")
    link_url: Mapped[str] = mapped_column(Text, default="")
    views_text: Mapped[str] = mapped_column(String(64), default="")
    duration_text: Mapped[str] = mapped_column(String(32), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    card: Mapped[Card] = relationship(back_populates="videos")


class CardCustomBlock(Base):
    __tablename__ = "card_custom_blocks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: gen_id("block"))
    card_id: Mapped[str] = mapped_column(ForeignKey("cards.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(128))
    content: Mapped[str] = mapped_column(Text, default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    card: Mapped[Card] = relationship(back_populates="custom_blocks")


class Contact(Base):
    __tablename__ = "contacts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: gen_id("contact"))
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    contact_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    source_card_id: Mapped[str | None] = mapped_column(ForeignKey("cards.id"), nullable=True)
    target_card_id: Mapped[str | None] = mapped_column(ForeignKey("cards.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    starred: Mapped[bool] = mapped_column(Boolean, default=False)
    has_update: Mapped[bool] = mapped_column(Boolean, default=False)
    update_type: Mapped[str] = mapped_column(String(32), default="")
    update_message: Mapped[str] = mapped_column(Text, default="")
    note: Mapped[str] = mapped_column(Text, default="")
    latest_interaction_text: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tags: Mapped[list["ContactTag"]] = relationship(back_populates="contact", cascade="all, delete-orphan")


class ContactTag(Base):
    __tablename__ = "contact_tags"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: gen_id("contact_tag"))
    contact_id: Mapped[str] = mapped_column(ForeignKey("contacts.id", ondelete="CASCADE"), index=True)
    tag_name: Mapped[str] = mapped_column(String(64))

    contact: Mapped[Contact] = relationship(back_populates="tags")


class Visitor(Base):
    __tablename__ = "visitors"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: gen_id("visitor"))
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    visitor_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    card_id: Mapped[str] = mapped_column(ForeignKey("cards.id"), index=True)
    source: Mapped[str] = mapped_column(String(64), default="")
    visit_count: Mapped[int] = mapped_column(Integer, default=1)
    first_visit_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_visit_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ExchangeRecord(Base):
    __tablename__ = "exchange_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: gen_id("exchange"))
    requester_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    target_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    requester_card_id: Mapped[str | None] = mapped_column(ForeignKey("cards.id"), nullable=True)
    target_card_id: Mapped[str | None] = mapped_column(ForeignKey("cards.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    channel: Mapped[str] = mapped_column(String(64), default="qrcode")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Setting(Base):
    __tablename__ = "settings"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: gen_id("setting"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    ai_tone: Mapped[str] = mapped_column(String(64), default="ä¸“ä¸šä¸”å‹å¥½")
    public_dynamics: Mapped[bool] = mapped_column(Boolean, default=True)
    privacy_mode: Mapped[str] = mapped_column(String(64), default="äº¤æ¢åŽå¯è§")
    blacklist_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="settings")


class Suggestion(Base):
    __tablename__ = "suggestions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: gen_id("suggestion"))
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    content: Mapped[str] = mapped_column(Text)
    contact: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
