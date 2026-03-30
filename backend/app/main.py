from fastapi import FastAPI

from .config import settings
from .database import Base, engine
from . import models  # noqa: F401
from .routers import ai_router, auth_router, cards_router, contacts_router, health_router, visitors_router, workbench_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name)

app.include_router(health_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(cards_router, prefix="/api/v1")
app.include_router(contacts_router, prefix="/api/v1")
app.include_router(visitors_router, prefix="/api/v1")
app.include_router(workbench_router, prefix="/api/v1")


@app.get("/")
def root() -> dict:
    return {
        "service": settings.app_name,
        "env": settings.app_env,
        "message": "壹席eSeat backend is running",
    }
