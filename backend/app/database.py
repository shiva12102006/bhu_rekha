"""
database.py
------------
Async SQLAlchemy engine/session configuration for the Intelligent Land
Record Digitization and Validation System.

Uses the `aiomysql` driver so that all DB I/O in FastAPI route handlers can
be awaited without blocking the event loop.
"""

from __future__ import annotations

import os
from typing import AsyncGenerator
from dotenv import load_dotenv

load_dotenv()

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
# Example: mysql+aiomysql://land_user:land_pass@localhost:3306/land_records_db
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+aiomysql://land_user:land_pass@localhost:3306/land_records_db",
)

# `echo=False` in production; flip to True for verbose SQL debugging.
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,   # Auto-reconnect stale MySQL connections
    pool_recycle=1800,    # Recycle connections every 30 min (MySQL wait_timeout safety)
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Declarative base class shared by all ORM models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields a scoped AsyncSession per request
    and guarantees rollback/close on any failure.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_models() -> None:
    """
    Creates all tables on startup if they do not exist.
    In a real production deployment this would be replaced by
    Alembic migrations, but is convenient for hackathon demos.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
