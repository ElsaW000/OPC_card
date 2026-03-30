from .ai import router as ai_router
from .auth import router as auth_router
from .cards import router as cards_router
from .contacts import router as contacts_router
from .health import router as health_router
from .visitors import router as visitors_router
from .workbench import router as workbench_router

__all__ = [
    "ai_router",
    "auth_router",
    "cards_router",
    "contacts_router",
    "health_router",
    "visitors_router",
    "workbench_router",
]
