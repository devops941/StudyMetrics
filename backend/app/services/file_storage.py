import hashlib
from pathlib import Path
from typing import Tuple
from app.core.config import settings

def save_uploaded_file(content: bytes, filename: str) -> Tuple[str, str, int]:
    """
    Saves file bytes into private local storage.
    Returns: (storage_key, sha256_checksum, file_size_bytes)
    """
    from app.core.security import generate_storage_key
    storage_key = generate_storage_key(filename)
    dest_path = settings.upload_path / storage_key

    # Calculate SHA-256
    sha256 = hashlib.sha256(content).hexdigest()

    with open(dest_path, "wb") as f:
        f.write(content)

    return storage_key, sha256, len(content)

def get_file_path(storage_key: str) -> Path:
    """Returns absolute path to a stored file, preventing path traversal."""
    safe_name = Path(storage_key).name
    path = settings.upload_path / safe_name
    if not path.exists():
        raise FileNotFoundError(f"Storage file '{safe_name}' not found.")
    return path
