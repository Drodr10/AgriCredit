from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db: str = "agricredit"
    app_title: str = "AgriCredit API"
    app_version: str = "0.1.0"

    model_config = SettingsConfigDict(env_file="/home/drodr10/Websites/AgriCredit/backend/.env", extra="ignore")


settings = Settings()
