from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..dev_seed import ensure_dev_demo_data
from ..models import User
from ..schemas import WechatLoginRequest, WechatLoginResponse

router = APIRouter(prefix="/auth", tags=["auth"])

DEV_OPENID = "wx_local_dev_user"


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