import json
from datetime import datetime
from urllib import parse as urllib_parse
from urllib import request as urllib_request

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..dev_seed import ensure_dev_demo_data
from ..models import Card, Contact, Setting, User, Visitor
from ..schemas import WechatLoginRequest, WechatLoginResponse

router = APIRouter(prefix="/auth", tags=["auth"])

DEV_OPENID = "wx_local_dev_user"


def _require_user(x_user_id: str | None, db: Session) -> User:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")
    user = db.get(User, x_user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid user")
    return user


class SettingsUpdateRequest(BaseModel):
    privacy_mode: str | None = None
    public_dynamics: bool | None = None
    ai_tone: str | None = None
    allow_ai_contacts_context: bool | None = None


def _parse_setting_meta(setting: Setting | None) -> dict:
    if setting is None:
        return {"blacklist": []}
    raw = setting.blacklist_json or "[]"
    try:
        parsed = json.loads(raw)
    except Exception:
        return {"blacklist": []}
    if isinstance(parsed, dict):
        next_meta = dict(parsed)
        next_meta["blacklist"] = next_meta.get("blacklist") if isinstance(next_meta.get("blacklist"), list) else []
        return next_meta
    if isinstance(parsed, list):
        return {"blacklist": list(parsed)}
    return {"blacklist": []}


def _write_setting_meta(setting: Setting, meta: dict) -> None:
    blacklist = meta.get("blacklist")
    setting.blacklist_json = json.dumps(
        {
            **meta,
            "blacklist": blacklist if isinstance(blacklist, list) else [],
        },
        ensure_ascii=False,
    )


def _allow_ai_contacts_context(setting: Setting | None) -> bool:
    meta = _parse_setting_meta(setting)
    return bool(meta.get("allow_ai_contacts_context", False))


def _set_allow_ai_contacts_context(setting: Setting, enabled: bool) -> None:
    meta = _parse_setting_meta(setting)
    meta["allow_ai_contacts_context"] = bool(enabled)
    _write_setting_meta(setting, meta)


def _resolve_wechat_openid(code: str) -> str:
    app_id = (settings.wechat_app_id or "").strip()
    app_secret = (settings.wechat_app_secret or "").strip()
    is_dev_env = (settings.app_env or "").lower() == "development"
    placeholder_values = {"replace_me", "your-secret", "your_app_secret", "placeholder"}
    has_real_secret = bool(app_secret) and app_secret.lower() not in placeholder_values
    if not app_id or not has_real_secret:
        if is_dev_env:
            return DEV_OPENID
        raise HTTPException(status_code=503, detail="Missing wechat app credentials")

    query = urllib_parse.urlencode(
        {
            "appid": app_id,
            "secret": app_secret,
            "js_code": code,
            "grant_type": "authorization_code",
        }
    )
    req = urllib_request.Request(
        "https://api.weixin.qq.com/sns/jscode2session?" + query,
        method="GET",
    )
    with urllib_request.urlopen(req, timeout=10) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    openid = payload.get("openid")
    errcode = payload.get("errcode")
    if errcode or not openid:
        errmsg = payload.get("errmsg") or "wechat login failed"
        raise HTTPException(status_code=401, detail=f"Wechat login failed: {errmsg}")
    return str(openid)


def _has_dev_seed_data(user_id: str, db: Session) -> bool:
    has_card = bool(db.scalar(select(Card.id).where(Card.user_id == user_id).limit(1)))
    has_setting = bool(db.scalar(select(Setting.id).where(Setting.user_id == user_id).limit(1)))
    has_contact = bool(db.scalar(select(Contact.id).where(Contact.owner_user_id == user_id).limit(1)))
    has_visitor = bool(db.scalar(select(Visitor.id).where(Visitor.owner_user_id == user_id).limit(1)))
    return has_card and has_setting and has_contact and has_visitor


def _should_seed_dev_demo_data(openid: str, user_id: str, db: Session) -> bool:
    if openid != DEV_OPENID:
        return False
    if (settings.app_env or "").lower() != "development":
        return False
    return not _has_dev_seed_data(user_id, db)


@router.post("/wechat/login", response_model=WechatLoginResponse)
def wechat_login(payload: WechatLoginRequest, db: Session = Depends(get_db)) -> WechatLoginResponse:
    openid = _resolve_wechat_openid(payload.code)
    user = db.scalar(select(User).where(User.wechat_openid == openid))
    is_new_user = False

    if not user:
        is_new_user = True
        user = User(
            wechat_openid=openid,
            nickname="新用户",
            source="miniapp",
            last_login_at=datetime.utcnow(),
        )
        db.add(user)
    else:
        user.last_login_at = datetime.utcnow()

    db.commit()
    db.refresh(user)
    if _should_seed_dev_demo_data(openid, user.id, db):
        ensure_dev_demo_data(db, user)
        db.refresh(user)

    return WechatLoginResponse(
        user_id=user.id,
        openid=user.wechat_openid,
        session_token=f"session_{user.id}",
        is_new_user=is_new_user,
    )


@router.get('/me')
def get_me(
    x_user_id: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> dict:
    user = _require_user(x_user_id, db)
    setting = user.settings
    default_card = next((c for c in user.cards if c.is_default), user.cards[0] if user.cards else None)
    return {
        'success': True,
        'user': {
            'id': user.id,
            'nickname': user.nickname or (default_card.name if default_card else ''),
            'avatar_url': user.avatar_url or (default_card.avatar_url if default_card else ''),
            'phone': user.phone or (default_card.phone if default_card else ''),
        },
        'settings': {
            'privacy_mode': setting.privacy_mode if setting else '交换后可见',
            'public_dynamics': setting.public_dynamics if setting else True,
            'ai_tone': setting.ai_tone if setting else '专业友好',
            'allow_ai_contacts_context': _allow_ai_contacts_context(setting),
        },
    }


@router.patch('/settings')
def update_settings(
    payload: SettingsUpdateRequest,
    x_user_id: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> dict:
    user = _require_user(x_user_id, db)
    setting = user.settings
    if not setting:
        setting = Setting(user_id=user.id)
        db.add(setting)
    if payload.privacy_mode is not None:
        setting.privacy_mode = payload.privacy_mode
    if payload.public_dynamics is not None:
        setting.public_dynamics = payload.public_dynamics
    if payload.ai_tone is not None:
        setting.ai_tone = payload.ai_tone
    if payload.allow_ai_contacts_context is not None:
        _set_allow_ai_contacts_context(setting, payload.allow_ai_contacts_context)
    db.commit()
    db.refresh(setting)
    return {
        'success': True,
        'settings': {
            'privacy_mode': setting.privacy_mode,
            'public_dynamics': setting.public_dynamics,
            'ai_tone': setting.ai_tone,
            'allow_ai_contacts_context': _allow_ai_contacts_context(setting),
        },
    }
