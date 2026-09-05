"""
routers/land.py
----------------
Core API surface for the Land Record Digitization system:

  POST /api/v1/land/upload           -> OCR pipeline + persist new record
  GET  /api/v1/land/records          -> list/filter records
  GET  /api/v1/land/records/{id}     -> single record detail
  PUT  /api/v1/land/verify/{id}      -> Patwari human-in-the-loop verification
  GET  /api/v1/land/analytics        -> dashboard aggregate stats
  GET  /api/v1/land/bhulekh/search   -> public citizen search
"""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime
from typing import Optional

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import AuditTrail, LandRecord, RecordStatus
from app.ocr_engine import run_ocr_pipeline
from app.schemas import (
    BhulekhCertificate,
    DashboardStats,
    DistrictProgress,
    FieldConfidence,
    LandRecordDetail,
    LandRecordListItem,
    LandRecordUploadResponse,
    LandRecordVerifyPayload,
    LandRecordVerifyResponse,
)

router = APIRouter(prefix="/api/v1/land", tags=["Land Records"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".pdf", ".tiff"}
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# 1. UPLOAD + OCR PIPELINE
# ---------------------------------------------------------------------------
@router.post(
    "/upload",
    response_model=LandRecordUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a scanned land record and run the OCR extraction pipeline",
)
async def upload_land_record(
    file: UploadFile = File(..., description="Scanned image or PDF of the land record"),
    db: AsyncSession = Depends(get_db),
) -> LandRecordUploadResponse:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{ext}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # --- Persist raw file to disk (would be S3/GCS/object storage in prod) ---
    stored_name = f"{uuid.uuid4()}{ext}"
    stored_path = os.path.join(UPLOAD_DIR, stored_name)
    async with aiofiles.open(stored_path, "wb") as out_file:
        await out_file.write(file_bytes)

    # --- Step 1 & 2: Run mock multilingual OCR + keyword extraction ---
    ocr_result = run_ocr_pipeline(file_bytes, file.filename or stored_name)

    # --- Step 3: confidence already computed inside pipeline ---
    record = LandRecord(
        file_name=file.filename or stored_name,
        file_url=f"/static/{UPLOAD_DIR}/{stored_name}",
        owner_name=ocr_result.fields.get("owner_name") or None,
        survey_no=ocr_result.fields.get("survey_no") or None,
        khasra_no=ocr_result.fields.get("khasra_no") or None,
        khata_no=ocr_result.fields.get("khata_no") or None,
        plot_area=ocr_result.fields.get("plot_area") or None,
        village=ocr_result.fields.get("village") or None,
        tehsil=ocr_result.fields.get("tehsil") or None,
        district=ocr_result.fields.get("district") or None,
        land_classification=ocr_result.fields.get("land_classification") or None,
        confidence_score=ocr_result.overall_confidence,
        field_confidence_json=json.dumps(ocr_result.field_confidence),
        extracted_text=ocr_result.extracted_text,
        status=RecordStatus.PENDING_VERIFICATION,
    )

    # --- Step 4: Save with status 'pending_verification' ---
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return LandRecordUploadResponse(
        id=record.id,
        record_uid=record.record_uid,
        file_name=record.file_name,
        file_url=record.file_url,
        owner_name=record.owner_name,
        survey_no=record.survey_no,
        khasra_no=record.khasra_no,
        khata_no=record.khata_no,
        plot_area=record.plot_area,
        village=record.village,
        tehsil=record.tehsil,
        district=record.district,
        land_classification=record.land_classification,
        confidence_score=record.confidence_score,
        field_confidence=FieldConfidence(**ocr_result.field_confidence),
        extracted_text=record.extracted_text or "",
        status=record.status.value,
        created_at=record.created_at,
    )


# ---------------------------------------------------------------------------
# 2. LIST + FILTER
# ---------------------------------------------------------------------------
@router.get(
    "/records",
    response_model=list[LandRecordListItem],
    summary="List land records, optionally filtered by status and district",
)
async def list_land_records(
    status_filter: Optional[str] = Query(None, alias="status", description="pending_verification | verified"),
    district: Optional[str] = Query(None, description="Filter by district name (case-insensitive)"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> list[LandRecordListItem]:
    stmt = select(LandRecord).order_by(LandRecord.updated_at.desc())

    if status_filter:
        try:
            stmt = stmt.where(LandRecord.status == RecordStatus(status_filter))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status '{status_filter}'.")

    if district:
        stmt = stmt.where(func.lower(LandRecord.district) == district.lower())

    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    records = result.scalars().all()
    return [LandRecordListItem.model_validate(r) for r in records]


# ---------------------------------------------------------------------------
# 3. SINGLE RECORD DETAIL (for the verification panel)
# ---------------------------------------------------------------------------
@router.get(
    "/records/{record_id}",
    response_model=LandRecordDetail,
    summary="Fetch full detail (incl. per-field confidence) for one record",
)
async def get_land_record(record_id: int, db: AsyncSession = Depends(get_db)) -> LandRecordDetail:
    record = await db.get(LandRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Land record not found.")

    field_conf = json.loads(record.field_confidence_json or "{}")
    return LandRecordDetail(
        id=record.id,
        record_uid=record.record_uid,
        file_name=record.file_name,
        file_url=record.file_url,
        owner_name=record.owner_name,
        survey_no=record.survey_no,
        khasra_no=record.khasra_no,
        khata_no=record.khata_no,
        plot_area=record.plot_area,
        village=record.village,
        tehsil=record.tehsil,
        district=record.district,
        land_classification=record.land_classification,
        confidence_score=record.confidence_score,
        field_confidence=FieldConfidence(**field_conf),
        extracted_text=record.extracted_text or "",
        status=record.status.value,
        created_at=record.created_at,
        verified_by=record.verified_by,
        updated_at=record.updated_at,
    )


# ---------------------------------------------------------------------------
# 4. VERIFY (Human-in-the-loop correction by Patwari)
# ---------------------------------------------------------------------------
@router.put(
    "/verify/{record_id}",
    response_model=LandRecordVerifyResponse,
    summary="Submit Patwari-corrected fields and mark the record as verified",
)
async def verify_land_record(
    record_id: int,
    payload: LandRecordVerifyPayload,
    db: AsyncSession = Depends(get_db),
) -> LandRecordVerifyResponse:
    record = await db.get(LandRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Land record not found.")

    # Apply corrected fields from the Patwari's review
    update_data = payload.model_dump(exclude={"verified_by_user_id"}, exclude_unset=True)
    for field_name, value in update_data.items():
        setattr(record, field_name, value)

    record.status = RecordStatus.VERIFIED
    record.verified_by = payload.verified_by_user_id
    record.updated_at = datetime.utcnow()

    audit_entry = AuditTrail(
        user_id=payload.verified_by_user_id,
        action="VERIFIED_RECORD",
        target_record_id=record.id,
    )
    db.add(audit_entry)

    await db.commit()
    await db.refresh(record)

    return LandRecordVerifyResponse(
        id=record.id,
        status=record.status.value,
        verified_by=record.verified_by,
        updated_at=record.updated_at,
    )


# ---------------------------------------------------------------------------
# 5. ANALYTICS (Executive Dashboard)
# ---------------------------------------------------------------------------
@router.get(
    "/analytics",
    response_model=DashboardStats,
    summary="Aggregate stats for the Executive Analytics Dashboard",
)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)) -> DashboardStats:
    total_result = await db.execute(select(func.count(LandRecord.id)))
    total_processed = total_result.scalar_one()

    avg_result = await db.execute(select(func.avg(LandRecord.confidence_score)))
    average_accuracy = round(avg_result.scalar_one() or 0.0, 1)

    pending_result = await db.execute(
        select(func.count(LandRecord.id)).where(LandRecord.status == RecordStatus.PENDING_VERIFICATION)
    )
    pending_verifications = pending_result.scalar_one()

    error_result = await db.execute(
        select(func.count(LandRecord.id)).where(LandRecord.confidence_score < 50)
    )
    error_count = error_result.scalar_one()

    district_result = await db.execute(
        select(
            LandRecord.district,
            func.count(LandRecord.id),
            func.sum(case((LandRecord.status == RecordStatus.VERIFIED, 1), else_=0)),
        )
        .where(LandRecord.district.is_not(None))
        .group_by(LandRecord.district)
    )
    district_progress = [
        DistrictProgress(
            district=district or "Unknown",
            total=total,
            verified=verified or 0,
            progress_percent=round(((verified or 0) / total) * 100, 1) if total else 0.0,
        )
        for district, total, verified in district_result.all()
    ]

    return DashboardStats(
        total_processed=total_processed,
        average_accuracy=average_accuracy,
        pending_verifications=pending_verifications,
        error_count=error_count,
        district_progress=district_progress,
    )


# ---------------------------------------------------------------------------
# 6. BHULEKH PUBLIC SEARCH
# ---------------------------------------------------------------------------
@router.get(
    "/bhulekh/search",
    response_model=list[BhulekhCertificate],
    summary="Citizen-facing search for verified land ownership records",
)
async def bhulekh_search(
    khasra_no: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    tehsil: Optional[str] = Query(None),
    village: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> list[BhulekhCertificate]:
    # Only VERIFIED records are exposed to the public portal.
    stmt = select(LandRecord).where(LandRecord.status == RecordStatus.VERIFIED)

    if khasra_no:
        stmt = stmt.where(LandRecord.khasra_no == khasra_no)
    if district:
        stmt = stmt.where(func.lower(LandRecord.district) == district.lower())
    if tehsil:
        stmt = stmt.where(func.lower(LandRecord.tehsil) == tehsil.lower())
    if village:
        stmt = stmt.where(func.lower(LandRecord.village) == village.lower())

    result = await db.execute(stmt.limit(25))
    records = result.scalars().all()
    return [BhulekhCertificate.model_validate(r) for r in records]
