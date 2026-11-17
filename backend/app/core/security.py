import re
import uuid
from pathlib import Path
from fastapi import HTTPException, status

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}

def sanitize_filename(filename: str) -> str:
    """Removes path traversals and special characters from filenames."""
    clean_name = Path(filename).name
    clean_name = re.sub(r"[^a-zA-Z0-9_.-]", "_", clean_name)
    return clean_name

def generate_storage_key(original_filename: str) -> str:
    """Generates a secure UUID-based storage filename to prevent overwrites or traversal."""
    ext = Path(original_filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    return f"{uuid.uuid4().hex}{ext}"

def generate_pseudonym(prefix: str = "STD") -> str:
    """Generates a pseudonymous student record ID."""
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"
