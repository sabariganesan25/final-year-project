from fastapi import APIRouter

from app.models.schemas import User
from app.services.graph_service import register_user

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/register")
def create_user(user: User):
    return register_user(user)
