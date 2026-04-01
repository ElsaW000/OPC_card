from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    ok: bool = True
    service: str
    env: str


class WechatLoginRequest(BaseModel):
    code: str = Field(min_length=1)


class WechatLoginResponse(BaseModel):
    success: bool = True
    user_id: str
    openid: str
    session_token: str
    is_new_user: bool


class CardProjectPayload(BaseModel):
    title: str = ""
    description: str = ""
    thumbnail_url: str = ""
    link_url: str = ""
    github_url: str = ""
    tags: list[str] = Field(default_factory=list)
    sort_order: int = 0


class CardVideoPayload(BaseModel):
    title: str = ""
    thumbnail_url: str = ""
    link_url: str = ""
    views_text: str = ""
    duration_text: str = ""
    sort_order: int = 0


class CardCustomBlockPayload(BaseModel):
    title: str = ""
    content: str = ""
    sort_order: int = 0


class CardSummary(BaseModel):
    id: str
    title: str
    template: str
    is_default: bool
    name: str
    role: str
    company: str | None = None
    banner_url: str | None = None
    avatar_url: str | None = None


class CardUpsertRequest(BaseModel):
    template: Literal["universal", "developer", "designer", "boss"] = "universal"
    title: str = ""
    is_default: bool = False
    name: str
    name_en: str = ""
    role: str = ""
    bio: str = ""
    company: str = ""
    business: str = ""
    cooperation: str = ""
    location_country: str = ""
    location_city: str = ""
    wechat: str = ""
    phone: str = ""
    email: str = ""
    github_url: str = ""
    twitter_url: str = ""
    banner_url: str = ""
    avatar_url: str = ""
    years: str = ""
    tech_stack: str = ""
    products_count: str = ""
    users_count: str = ""
    footer_title: str = ""
    footer_desc: str = ""
    projects: list[CardProjectPayload] = Field(default_factory=list)
    videos: list[CardVideoPayload] = Field(default_factory=list)
    custom_cards: list[CardCustomBlockPayload] = Field(default_factory=list)


class CardListResponse(BaseModel):
    success: bool = True
    items: list[CardSummary]


class ContactItem(BaseModel):
    _id: str
    cardId: str = ""
    name: str
    role: str = ""
    company: str = ""
    phone: str = ""
    email: str = ""
    wechat: str = ""
    avatarUrl: str = ""
    bannerUrl: str = ""
    bio: str = ""
    tags: list[str] = Field(default_factory=list)
    starred: bool = False
    hasUpdate: bool = False
    updateType: str = ""
    updateMessage: str = ""
    status: str = "active"
    latestInteractionText: str = ""
    note: str = ""


class ContactListResponse(BaseModel):
    success: bool = True
    contacts: list[ContactItem]
    pendingRequests: list[ContactItem]
    updatedTips: list[ContactItem]
    tags: list[str]


class VisitorItem(BaseModel):
    _id: str
    name: str
    role: str = ""
    avatarUrl: str = ""
    source: str = ""
    location: str = ""
    visitDate: str = ""
    visitTimeText: str = "??"
    visitCount: int = 1


class VisitorListResponse(BaseModel):
    success: bool = True
    visitors: list[VisitorItem]


class VisitorRecordRequest(BaseModel):
    card_id: str
    source: str = "名片分享"


class VisitorRecordResponse(BaseModel):
    success: bool = True
    visitor_id: str


class PersonaTag(BaseModel):
    label: str
    size: int


class SettingsSummary(BaseModel):
    aiTone: str = "专业且友好"
    publicDynamics: bool = True
    privacyMode: str = "交换后可见"
    blacklistCount: int = 0


class WorkbenchResponse(BaseModel):
    success: bool = True
    defaultCard: dict | None = None
    weeklyViews: int
    visitorCount: int
    personaTags: list[PersonaTag]
    personaSummary: list[str] = Field(default_factory=list)
    starredContacts: list[ContactItem]
    recentVisitors: list[VisitorItem]
    settingsSummary: SettingsSummary
