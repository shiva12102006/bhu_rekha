"""
routers/auth.py
----------------
Minimal authentication endpoints for demo purposes.

Note: For the SIH hackathon scope this uses simple bcrypt password hashing
and returns the user record directly. In a full production rollout this
would be replaced with OAuth2 + JWT bearer tokens (python-jose) and
role-based route guards (admin vs patwari).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, UserRole
from app.schemas import UserCreate, UserOut

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserCreate, db: AsyncSession = Depends(get_db)) -> UserOut:
    existing = await db.execute(select(User).where(User.username == payload.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists.")

    try:
        role = UserRole(payload.role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'patwari'.")

    user = User(
        username=payload.username,
        password_hash=pwd_context.hash(payload.password),
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)


@router.post("/login", response_model=UserOut)
async def login_user(payload: UserCreate, db: AsyncSession = Depends(get_db)) -> UserOut:
    result = await db.execute(select(User).where(User.username == payload.username))
    user = result.scalar_one_or_none()
    if not user or not pwd_context.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    return UserOut.model_validate(user)
