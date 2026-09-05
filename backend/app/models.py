"""
models.py
---------
Normalized SQLAlchemy ORM models for the Land Record Digitization system.

Tables
------
1. users          -> Patwari / Admin accounts
2. land_records   -> Digitized land record documents + extracted fields
3. audit_trails   -> Immutable log of every verification/edit action
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    DateTime,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    PATWARI = "patwari"


class RecordStatus(str, enum.Enum):
    PENDING_VERIFICATION = "pending_verification"
    VERIFIED = "verified"


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, native_enum=False, length=20), default=UserRole.PATWARI, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    audit_entries: Mapped[list["AuditTrail"]] = relationship(back_populates="user")
    verified_records: Mapped[list["LandRecord"]] = relationship(back_populates="verifier")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<User id={self.id} username={self.username} role={self.role}>"


# ---------------------------------------------------------------------------
# Land Records
# ---------------------------------------------------------------------------
class LandRecord(Base):
    __tablename__ = "land_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    record_uid: Mapped[str] = mapped_column(
        String(36), unique=True, index=True, default=lambda: str(uuid.uuid4())
    )

    # --- Source document ---
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)

    # --- Extracted land record fields ---
    owner_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    survey_no: Mapped[str | None] = mapped_column(String(50), nullable=True)
    khasra_no: Mapped[str | None] = mapped_column(String(50), nullable=True)
    khata_no: Mapped[str | None] = mapped_column(String(50), nullable=True)
    plot_area: Mapped[str | None] = mapped_column(String(50), nullable=True)  # e.g. "2.35 Hectare"
    village: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tehsil: Mapped[str | None] = mapped_column(String(100), nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    land_classification: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # --- AI / OCR metadata ---
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    # Per-field confidence stored as JSON-encoded text, e.g.
    # {"owner_name": 92.5, "khasra_no": 54.0, ...}
    field_confidence_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[RecordStatus] = mapped_column(
        Enum(RecordStatus, native_enum=False, length=30),
        default=RecordStatus.PENDING_VERIFICATION,
        nullable=False,
        index=True,
    )

    verified_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    verifier: Mapped["User | None"] = relationship(back_populates="verified_records")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    audit_entries: Mapped[list["AuditTrail"]] = relationship(back_populates="target_record")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<LandRecord id={self.id} khasra_no={self.khasra_no} status={self.status}>"


# ---------------------------------------------------------------------------
# Audit Trails
# ---------------------------------------------------------------------------
class AuditTrail(Base):
    __tablename__ = "audit_trails"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(255), nullable=False)  # e.g. "VERIFIED_RECORD"
    target_record_id: Mapped[int] = mapped_column(ForeignKey("land_records.id"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="audit_entries")
    target_record: Mapped["LandRecord"] = relationship(back_populates="audit_entries")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<AuditTrail user_id={self.user_id} action={self.action} record={self.target_record_id}>"
