"""
ocr_engine.py
-------------
Simulated multilingual (Hindi/English) OCR + rule-based information
extraction pipeline for scanned land records (7/12 extracts, Khasra-Khatauni,
Jamabandi, etc.).

In a production system this module would wrap a real OCR engine (Tesseract
with `hin+eng` traineddata, Google Vision, or a fine-tuned TrOCR model).
For this hackathon build it deterministically *simulates* OCR degradation
and confidence scoring so the rest of the pipeline (extraction, scoring,
human-in-the-loop review) can be demonstrated end-to-end without a real
OCR binary being installed.

Public API
----------
run_ocr_pipeline(file_bytes: bytes, file_name: str) -> OcrResult
"""

from __future__ import annotations

import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'

import hashlib
import random
import re
import easyocr
import io
from dataclasses import dataclass, field


# ---------------------------------------------------------------------------
# Regex keyword map: Hindi/English land-record vocabulary -> canonical field
# ---------------------------------------------------------------------------
FIELD_PATTERNS: dict[str, list[str]] = {
    "owner_name": [r"नाम\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s]{3,40})", r"Owner\s*Name\s*[:\-]?\s*([A-Za-z\s]{3,40})"],
    "khasra_no": [r"खसरा\s*(?:नं\.?|नंबर|संख्या)?\s*[:\-]?\s*([0-9\/\-]+)", r"Khasra\s*No\.?\s*[:\-]?\s*([0-9\/\-]+)"],
    "khata_no": [r"खाता\s*(?:नं\.?|नंबर|संख्या)?\s*[:\-]?\s*([0-9\/\-]+)", r"Khata\s*No\.?\s*[:\-]?\s*([0-9\/\-]+)"],
    "survey_no": [r"सर्वे\s*(?:नं\.?|नंबर)?\s*[:\-]?\s*([0-9\/\-]+)", r"Survey\s*No\.?\s*[:\-]?\s*([0-9\/\-]+)"],
    "plot_area": [r"क्षेत्रफल\s*[:\-]?\s*([0-9\.]+\s*(?:हेक्टेयर|एकड़|Hectare|Acre)?)", r"Area\s*[:\-]?\s*([0-9\.]+\s*(?:Hectare|Acre)?)"],
    "village": [r"गाँव\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s]{2,30})", r"Village\s*[:\-]?\s*([A-Za-z\s]{2,30})"],
    "tehsil": [r"तहसील\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s]{2,30})", r"Tehsil\s*[:\-]?\s*([A-Za-z\s]{2,30})"],
    "district": [r"जिला\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s]{2,30})", r"District\s*[:\-]?\s*([A-Za-z\s]{2,30})"],
    "land_classification": [r"भूमि\s*(?:प्रकार|वर्ग)\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s]{2,30})", r"Land\s*Type\s*[:\-]?\s*([A-Za-z\s]{2,30})"],
}

# Initialize the EasyOCR reader (loads models into memory)
# We support Hindi ('hi') and English ('en').
print("Loading EasyOCR models (Hindi & English)... this may take a moment.")
reader = easyocr.Reader(['hi', 'en'], gpu=False)


@dataclass
class OcrResult:
    extracted_text: str
    fields: dict[str, str] = field(default_factory=dict)
    field_confidence: dict[str, float] = field(default_factory=dict)
    overall_confidence: float = 0.0


def _extract_fields(text: str, clarity: float, seed: int) -> tuple[dict[str, str], dict[str, float]]:
    """
    Rule-based / regex extraction of canonical fields from raw OCR text.
    """
    rng = random.Random(seed + 1)
    fields: dict[str, str] = {}
    confidences: dict[str, float] = {}

    for canonical_field, patterns in FIELD_PATTERNS.items():
        matched_value = None
        for pattern in patterns:
            match = re.search(pattern, text, flags=re.IGNORECASE | re.UNICODE)
            if match:
                matched_value = match.group(1).strip(" _\t")
                break

        if not matched_value:
            fields[canonical_field] = ""
            confidences[canonical_field] = round(rng.uniform(15, 35), 1)  # not found -> low confidence
            continue

        fields[canonical_field] = matched_value

        # Confidence heuristic based on match length and base clarity
        noise_penalty = matched_value.count("_") * 8
        length_penalty = 10 if len(matched_value) < 2 else 0
        base_score = clarity * 100
        score = max(5.0, min(99.0, base_score - noise_penalty - length_penalty + rng.uniform(-4, 4)))
        confidences[canonical_field] = round(score, 1)

    return fields, confidences


def run_ocr_pipeline(file_bytes: bytes, file_name: str) -> OcrResult:
    """
    Main entry point for the real OCR + extraction pipeline using EasyOCR.
    """
    seed = int(hashlib.sha256(file_bytes or file_name.encode()).hexdigest(), 16) % (10**8)
    
    try:
        # Run EasyOCR on the image bytes
        # detail=0 returns just the text, paragraph=True groups text into paragraphs
        raw_results = reader.readtext(file_bytes, detail=0, paragraph=True)
        extracted_text = "\n".join(raw_results)
        clarity = 0.85 # Assume a base clarity for actual OCR
    except Exception as e:
        print(f"OCR Error: {e}")
        extracted_text = f"Error during OCR processing: {e}"
        clarity = 0.3

    fields, field_confidence = _extract_fields(extracted_text, clarity, seed)

    # Overall score = mean of field confidences, weighted toward key identity fields
    weights = {
        "owner_name": 1.5, "khasra_no": 1.5, "khata_no": 1.3, "survey_no": 1.0,
        "plot_area": 1.0, "village": 1.0, "tehsil": 0.8, "district": 0.8,
        "land_classification": 0.8,
    }
    weighted_sum = sum(field_confidence[f] * weights[f] for f in field_confidence)
    weight_total = sum(weights[f] for f in field_confidence)
    overall = round(weighted_sum / weight_total, 1) if weight_total else 0.0

    return OcrResult(
        extracted_text=extracted_text.strip(),
        fields=fields,
        field_confidence=field_confidence,
        overall_confidence=overall,
    )

