"""
main.py
-------
Application entrypoint for the Intelligent Land Record Digitization and
Validation System backend.

Run locally:
    uvicorn app.main:app --reload --port 8000

Environment variables:
    DATABASE_URL   e.g. mysql+aiomysql://user:pass@localhost:3306/land_records_db
    UPLOAD_DIR     local folder for storing scanned documents (default: "uploads")
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import init_models
from app.routers import auth, land

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist (replace with Alembic migrations in prod)
    await init_models()
    yield
    # Shutdown: nothing to clean up currently


app = FastAPI(
    title="Intelligent Land Record Digitization and Validation System",
    description=(
        "SIH 2026 | Ministry of Rural Development — AI-assisted digitization "
        "of legacy land records with human-in-the-loop verification and a "
        "public Bhulekh search portal."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow the Next.js frontend (adjust origins for production deploy)
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Static file serving for uploaded scanned documents
# ---------------------------------------------------------------------------
app.mount(f"/static/{UPLOAD_DIR}", StaticFiles(directory=UPLOAD_DIR), name="uploaded-documents")

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(land.router)
app.include_router(auth.router)


@app.get("/", tags=["Health"])
async def root() -> dict:
    return {
        "service": "Land Record Digitization API",
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    return {"status": "ok"}
