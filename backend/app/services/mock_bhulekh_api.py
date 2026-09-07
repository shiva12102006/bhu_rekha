"""
mock_bhulekh_api.py
-------------------
Simulates a connection to a central state land record database (e.g. UP Bhulekh)
for Cross-Database Verification.
"""

from dataclasses import dataclass
from typing import Optional, List

@dataclass
class BhulekhRecord:
    khasra_no: str
    owner_name: str
    area: str
    land_type: str

# Simulated Ground Truth Database
_MOCK_BHULEKH_DB = {
    "123/4": BhulekhRecord(khasra_no="123/4", owner_name="Ramesh Kumar", area="1.5 Hectare", land_type="Agricultural"),
    "456-A": BhulekhRecord(khasra_no="456-A", owner_name="Suresh Singh", area="2.0 Hectare", land_type="Residential"),
    "789/2": BhulekhRecord(khasra_no="789/2", owner_name="Geeta Devi", area="0.5 Acre", land_type="Agricultural"),
}

def verify_with_bhulekh(extracted_khasra: str, extracted_owner: str, extracted_area: str) -> tuple[bool, List[str]]:
    """
    Cross-verifies extracted OCR data against the mock Bhulekh database.
    Returns: (is_verified, list_of_warnings)
    """
    if not extracted_khasra:
        return False, ["Khasra Number missing in extracted document."]

    # Basic normalization for comparison
    normalized_khasra = str(extracted_khasra).strip()
    
    if normalized_khasra not in _MOCK_BHULEKH_DB:
        return False, [f"Khasra Number '{normalized_khasra}' not found in official Bhulekh database. Possible fake document."]

    official_record = _MOCK_BHULEKH_DB[normalized_khasra]
    warnings = []

    # 1. Verify Owner Name (loose match for demo purposes)
    if extracted_owner:
        extracted_owner_lower = str(extracted_owner).lower().strip()
        official_owner_lower = official_record.owner_name.lower().strip()
        
        # In a real app, use fuzzy matching like Levenshtein distance
        if official_owner_lower not in extracted_owner_lower and extracted_owner_lower not in official_owner_lower:
            warnings.append(f"Owner Mismatch: OCR extracted '{extracted_owner}', but official record shows '{official_record.owner_name}'.")
    
    # 2. Verify Area (loose match)
    if extracted_area:
        # Just extracting numbers for a naive comparison
        import re
        ext_nums = re.findall(r"[\d\.]+", str(extracted_area))
        off_nums = re.findall(r"[\d\.]+", official_record.area)
        
        if ext_nums and off_nums and ext_nums[0] != off_nums[0]:
             warnings.append(f"Area Mismatch: OCR extracted '{extracted_area}', but official record shows '{official_record.area}'.")

    if warnings:
        return False, warnings
        
    return True, []
