from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..dev_seed import ensure_dev_demo_data
from ..models import Setting, User
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


@router.post("/wechat/login", response_model=WechatLoginResponse)
def wechat_login(payload: WechatLoginRequest, db: Session = Depends(get_db)) -> WechatLoginResponse:
    mock_openid = DEV_OPENID
    user = db.scalar(select(User).where(User.wechat_openid == mock_openid))
    is_new_user = False

    if not user:
        is_new_user = True
        user = User(
            wechat_openid=mock_openid,
            nickname="新用户",
            source="miniapp",
            last_login_at=datetime.utcnow(),
        )
        db.add(user)
    else:
        user.last_login_at = datetime.utcnow()

    db.commit()
    db.refresh(user)
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
    db.commit()
    db.refresh(setting)
    return {
        'success': True,
        'settings': {
            'privacy_mode': setting.privacy_mode,
            'public_dynamics': setting.public_dynamics,
            'ai_tone': setting.ai_tone,
        },
    }