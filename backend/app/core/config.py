from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db: str = "agricredit"
    app_title: str = "AgriCredit API"
    app_version: str = "0.1.0"
    
    clerk_secret_key: str = ""
    next_public_clerk_publishable_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
