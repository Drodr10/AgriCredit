from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Calculate the path to the .env file (one level up from app/core/config.py is app/core/, two levels up is app/, three is backend/)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    mongodb_url: str
    mongodb_db: str = "agricredit"
    app_title: str = "AgriCredit API"
    app_version: str = "0.1.0"
    
    # Sensitive keys - No defaults to prevent accidental check-ins
    clerk_secret_key: str
    next_public_clerk_publishable_key: str

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE), 
        env_file_encoding="utf-8", 
        extra="ignore"
    )


settings = Settings()
