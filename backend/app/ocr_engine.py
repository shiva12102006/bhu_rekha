"""
ocr_engine.py
-------------
Production-ready Multimodal VLM OCR extraction pipeline using Gemini 1.5.
Handles complex Indian land records (Khatauni, Jamabandi) natively.
"""
import os
import json
import hashlib
import mimetypes
import re
from dataclasses import dataclass, field
import google.generativeai as genai
from pydantic import BaseModel, Field
import fitz  # PyMuPDF
from rapidfuzz import process, fuzz

# Configure Gemini API if key is present
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

@dataclass
class OcrResult:
    extracted_text: str
    fields: dict[str, str] = field(default_factory=dict)
    field_confidence: dict[str, float] = field(default_factory=dict)
    overall_confidence: float = 0.0

class LandRecordData(BaseModel):
    owner_name: str = Field(description="Name of the owner(s) or Khatedar (खातेदार का नाम). Do not include father's name. If not found, return empty string.")
    khasra_no: str = Field(description="Khasra Number / Gata Number (खसरा संख्या / गाटा संख्या). Use slashes if present (e.g. 165/3/1). If not found, return empty string.")
    khata_no: str = Field(description="Khata Number / Khatauni Number (खाता संख्या). If not found, return empty string.")
    survey_no: str = Field(description="Survey Number. If not found, return empty string.")
    plot_area: str = Field(description="Area of the plot with units, e.g. '0.1180 Hectare'. If not found, return empty string.")
    village: str = Field(description="Village Name (ग्राम). Translate to English if possible. If not found, return empty string.")
    tehsil: str = Field(description="Tehsil (तहसील). Translate to English if possible. If not found, return empty string.")
    district: str = Field(description="District (जनपद/जिला). Translate to English if possible. If not found, return empty string.")
    land_classification: str = Field(description="Land Type/Classification (श्रेणी). If not found, return empty string.")
    field_confidence_scores: dict[str, float] = Field(description="A dictionary mapping each extracted field name to a confidence score between 0.0 and 100.0 based on how clear and legible the text was in the document.")

def standardize_text(text: str) -> str:
    if not text:
        return ""
    
    # Map Hindi numerals to Arabic numerals
    hindi_to_arabic = str.maketrans('०१२३४५६७८९', '0123456789')
    text = text.translate(hindi_to_arabic)
    
    # Standardize area units (case-insensitive)
    text = re.sub(r'(?i)(hectare|hec|हेक्टेयर)', 'Hectare', text)
    text = re.sub(r'(?i)(sq\.?m\.?|square meters?|वर्ग मीटर)', 'Sq.M', text)
    
    return text.strip()

def run_ocr_pipeline(file_bytes: bytes, file_name: str, language: str = 'hi', learned_corrections: dict[str, str] = None) -> OcrResult:
    """
    Main entry point for the OCR + extraction pipeline using Gemini 1.5.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY not found. Fallback mode activated.")
        return _fallback_ocr(file_bytes, file_name, "No API key found in .env file.")

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-3.6-flash")
        prompt = "Extract the following land record details from this document. The document is usually in Hindi. Translate the extracted fields to English where appropriate (like District and Village names), but keep numbers and specific names accurate."
        
        mime_type, _ = mimetypes.guess_type(file_name)
        if not mime_type:
            mime_type = "image/jpeg"
            
        image_parts = []
        if mime_type == "application/pdf":
            # Multi-page PDF handling via PyMuPDF
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page in doc:
                pix = page.get_pixmap()
                image_parts.append({
                    "mime_type": "image/jpeg",
                    "data": pix.tobytes("jpeg")
                })
        else:
            image_parts.append({
                "mime_type": mime_type,
                "data": file_bytes
            })
        
        response = model.generate_content(
            [prompt] + image_parts,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=LandRecordData,
                temperature=0.1
            )
        )
        
        extracted_data = json.loads(response.text)
        
        fields = {
            "owner_name": standardize_text(extracted_data.get("owner_name", "")),
            "khasra_no": standardize_text(extracted_data.get("khasra_no", "")),
            "khata_no": standardize_text(extracted_data.get("khata_no", "")),
            "survey_no": standardize_text(extracted_data.get("survey_no", "")),
            "plot_area": standardize_text(extracted_data.get("plot_area", "")),
            "village": standardize_text(extracted_data.get("village", "")),
            "tehsil": standardize_text(extracted_data.get("tehsil", "")),
            "district": standardize_text(extracted_data.get("district", "")),
            "land_classification": standardize_text(extracted_data.get("land_classification", "")),
        }
        
        # Intelligent Confidences from VLM
        extracted_confidences = extracted_data.get("field_confidence_scores", {})
        field_confidence = {}
        for k, v in fields.items():
            if k in extracted_confidences:
                field_confidence[k] = float(extracted_confidences[k])
            else:
                field_confidence[k] = 99.0 if str(v).strip() else 15.0
        
        # Apply learned corrections using Fuzzy Matching
        if learned_corrections:
            for k, v in fields.items():
                if v.strip():
                    match = process.extractOne(v, learned_corrections.keys(), scorer=fuzz.ratio)
                    if match and match[1] > 85: # 85% similarity threshold
                        fields[k] = learned_corrections[match[0]]
                        field_confidence[k] = 100.0
                    
        overall = sum(field_confidence.values()) / len(field_confidence) if field_confidence else 0.0
        
        # Build raw text for debugging
        raw_text_lines = []
        for key, val in fields.items():
            if val:
                raw_text_lines.append(f"{key}: {val}")
                
        return OcrResult(
            extracted_text="\\n".join(raw_text_lines),
            fields={k: str(v) for k, v in fields.items()},
            field_confidence=field_confidence,
            overall_confidence=round(overall, 1),
        )
    except Exception as e:
        error_msg = str(e)
        print(f"Gemini API Error: {error_msg}. Falling back...")
        return _fallback_ocr(file_bytes, file_name, error_msg)

def _fallback_ocr(file_bytes, file_name, error_msg="") -> OcrResult:
    return OcrResult(
        extracted_text=f"Error: Could not extract using AI.\nReason: {error_msg}\n\nPlease verify your API Key.",
        fields={"owner_name": "Fallback User", "khasra_no": "000/0"},
        field_confidence={"owner_name": 10.0, "khasra_no": 10.0},
        overall_confidence=10.0
    )
