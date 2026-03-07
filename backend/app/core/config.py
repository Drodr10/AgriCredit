from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    mongodb_url: str = os.getenv("MONGODB_URL")
    mongodb_db: str = os.getenv("MONGODB_DB")
    app_title: str = os.getenv("APP_TITLE")
    app_version: str = os.getenv("APP_VERSION")
    
    clerk_secret_key: str = ""
    next_public_clerk_publishable_key: str = ""

    model_config = SettingsConfigDict(env_file="../../.env", extra="ignore")


settings = Settings()
