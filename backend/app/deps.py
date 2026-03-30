from fastapi import Header, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import User


def db_session() -> Session:
    return next(get_db())


def get_current_user(
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = None,
):
    if db is None:
        db = next(get_db())
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")
    user = db.get(User, x_user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid user")
    return user