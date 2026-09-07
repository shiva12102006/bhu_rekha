"""
schemas.py
----------
Pydantic v2 schemas used for request validation and response serialization.
Kept separate from SQLAlchemy models to decouple the wire format from the
persistence layer (standard clean-architecture practice).
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Land Record Schemas
# ---------------------------------------------------------------------------
class FieldConfidence(BaseModel):
    """Per-field OCR confidence, used to drive the low-confidence UI highlight."""
    owner_name: float = 0.0
    survey_no: float = 0.0
    khasra_no: float = 0.0
    khata_no: float = 0.0
    plot_area: float = 0.0
    village: float = 0.0
    tehsil: float = 0.0
    district: float = 0.0
    land_classification: float = 0.0


class LandRecordBase(BaseModel):
    owner_name: Optional[str] = None
    survey_no: Optional[str] = None
    khasra_no: Optional[str] = None
    khata_no: Optional[str] = None
    plot_area: Optional[str] = None
    village: Optional[str] = None
    tehsil: Optional[str] = None
    district: Optional[str] = None
    land_classification: Optional[str] = None


class LandRecordUploadResponse(LandRecordBase):
    """Returned immediately after OCR pipeline finishes processing an upload."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    record_uid: str
    file_name: str
    file_url: str
    confidence_score: float
    field_confidence: FieldConfidence
    extracted_text: str
    status: str
    is_verified_by_bhulekh: bool = False
    verification_warnings: Optional[str] = None
    created_at: datetime


class LandRecordListItem(LandRecordBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    record_uid: str
    file_name: str
    confidence_score: float
    status: str
    district: Optional[str] = None
    is_verified_by_bhulekh: bool = False
    verification_warnings: Optional[str] = None
    updated_at: datetime


class LandRecordDetail(LandRecordUploadResponse):
    """Full detail view used by the verification panel."""
    verified_by: Optional[int] = None
    updated_at: datetime


class LandRecordVerifyPayload(LandRecordBase):
    """
    Payload submitted by the Patwari after human-in-the-loop correction.
    `verified_by_user_id` mimics an authenticated user id (in production this
    would come from a JWT bearer token instead of the request body).
    """
    verified_by_user_id: int = Field(..., description="ID of the Patwari/Admin approving the record")


class LandRecordVerifyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    verified_by: Optional[int]
    updated_at: datetime
    message: str = "Record successfully verified and committed to the registry."


# ---------------------------------------------------------------------------
# Analytics Schemas
# ---------------------------------------------------------------------------
class DistrictProgress(BaseModel):
    district: str
    total: int
    verified: int
    progress_percent: float


class DashboardStats(BaseModel):
    total_processed: int
    average_accuracy: float
    pending_verifications: int
    error_count: int  # records with confidence_score < 50
    district_progress: list[DistrictProgress]


# ---------------------------------------------------------------------------
# Bhulekh (Public Portal) Schemas
# ---------------------------------------------------------------------------
class BhulekhCertificate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    record_uid: str
    owner_name: Optional[str]
    khasra_no: Optional[str]
    khata_no: Optional[str]
    survey_no: Optional[str]
    plot_area: Optional[str]
    village: Optional[str]
    tehsil: Optional[str]
    district: Optional[str]
    land_classification: Optional[str]
    status: str
    updated_at: datetime


# ---------------------------------------------------------------------------
# Auth Schemas (minimal, for demo/hackathon scope)
# ---------------------------------------------------------------------------
class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "patwari"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    role: str
    created_at: datetime
