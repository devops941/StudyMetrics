from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_ENV: str = "development"
    API_V1_PREFIX: str = "/api/v1"
    MONGODB_URI: str = "mongodb+srv://user_gokul:Lfg0bsxrzs3njKeA@cluster0.uurxkmz.mongodb.net/?retryWrites=true&w=majority"
    MONGODB_DATABASE: str = "StudyMetrics"
    MONGODB_COLLECTION: str = "StudyMetrics"
    UPLOAD_DIR: str = "./storage/uploads"
    MAX_UPLOAD_MB: int = 20
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,*"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def upload_path(self) -> Path:
        path = Path(self.UPLOAD_DIR)
        path.mkdir(parents=True, exist_ok=True)
        return path

settings = Settings()
