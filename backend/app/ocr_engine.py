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

import hashlib
import random
import re
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

# A small deterministic corpus of "specimen" jamabandi text blocks used to
# simulate what a real OCR engine would output for a scanned register page.
SPECIMEN_DOCUMENTS = [
    """
    ग्राम पंचायत अभिलेख | जमाबंदी वर्ष 2024-25
    नाम: रामलाल वर्मा
    खसरा नंबर: 145/2
    खाता नंबर: 78
    सर्वे नं: 145
    क्षेत्रफल: 2.35 हेक्टेयर
    गाँव: बहरामपुर
    तहसील: सदर
    जिला: प्रयागराज
    भूमि प्रकार: कृषि योग्य भूमि
    """,
    """
    Village Land Register | Jamabandi FY 2024-25
    Owner Name: Suresh Kumar Yadav
    Khasra No: 210/1
    Khata No: 42
    Survey No: 210
    Area: 1.10 Acre
    Village: Rampur Kalan
    Tehsil: Karchhana
    District: Prayagraj
    Land Type: Residential
    """,
]


@dataclass
class OcrResult:
    extracted_text: str
    fields: dict[str, str] = field(default_factory=dict)
    field_confidence: dict[str, float] = field(default_factory=dict)
    overall_confidence: float = 0.0


def _simulate_scan_noise(text: str, seed: int) -> tuple[str, float]:
    """
    Deterministically (per-file, via seed) degrade text to simulate
    scan artifacts: skew, faded ink, torn edges. Returns the noisy text
    and a 0-1 'clarity' factor used to drive confidence scores.
    """
    rng = random.Random(seed)
    clarity = rng.uniform(0.55, 0.99)  # overall document clarity for this scan

    chars = list(text)
    noisy_chars = []
    corruption_rate = (1 - clarity) * 0.15  # cap corruption so text stays parseable
    for ch in chars:
        if ch.strip() and rng.random() < corruption_rate:
            # Randomly drop or smudge a character to mimic OCR misreads.
            noisy_chars.append(rng.choice(["", ch, "_"]))
        else:
            noisy_chars.append(ch)
    return "".join(noisy_chars), clarity


def _extract_fields(text: str, clarity: float, seed: int) -> tuple[dict[str, str], dict[str, float]]:
    """
    Rule-based / regex extraction of canonical fields from raw OCR text,
    with a confidence score per field derived from:
      - whether a regex pattern matched at all
      - the document's overall scan clarity
      - length/sanity of the captured value (very short/garbled -> lower score)
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

        # Confidence heuristic: base on clarity, penalize noisy artifacts ("_")
        noise_penalty = matched_value.count("_") * 8
        length_penalty = 10 if len(matched_value) < 2 else 0
        base_score = clarity * 100
        score = max(5.0, min(99.0, base_score - noise_penalty - length_penalty + rng.uniform(-4, 4)))
        confidences[canonical_field] = round(score, 1)

    return fields, confidences


def run_ocr_pipeline(file_bytes: bytes, file_name: str) -> OcrResult:
    """
    Main entry point for the OCR + extraction pipeline.

    Steps:
      1. Select/simulate a scanned document text block (in production: real
         OCR engine output from `file_bytes`).
      2. Simulate scan-quality degradation deterministically per file.
      3. Run regex/rule-based keyword extraction for land-record fields.
      4. Compute a weighted overall confidence score (0-100).
    """
    # Deterministic seed derived from file content so repeated uploads of the
    # same file are reproducible (useful for demos/tests).
    seed = int(hashlib.sha256(file_bytes or file_name.encode()).hexdigest(), 16) % (10**8)
    rng = random.Random(seed)

    base_doc = SPECIMEN_DOCUMENTS[seed % len(SPECIMEN_DOCUMENTS)]
    noisy_text, clarity = _simulate_scan_noise(base_doc, seed)

    fields, field_confidence = _extract_fields(noisy_text, clarity, seed)

    # Overall score = mean of field confidences, weighted slightly toward
    # the identity fields (owner/khasra/khata) which matter most legally.
    weights = {
        "owner_name": 1.5, "khasra_no": 1.5, "khata_no": 1.3, "survey_no": 1.0,
        "plot_area": 1.0, "village": 1.0, "tehsil": 0.8, "district": 0.8,
        "land_classification": 0.8,
    }
    weighted_sum = sum(field_confidence[f] * weights[f] for f in field_confidence)
    weight_total = sum(weights[f] for f in field_confidence)
    overall = round(weighted_sum / weight_total, 1) if weight_total else 0.0

    return OcrResult(
        extracted_text=noisy_text.strip(),
        fields=fields,
        field_confidence=field_confidence,
        overall_confidence=overall,
    )
