from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongodb_url: str = "mongodb+srv://db_user:iK4o0JYTAnSjKY9a@agrodb.32wlqc3.mongodb.net/?appName=AgroDB"
    mongodb_db: str = "agricredit"
    app_title: str = "AgriCredit API"
    app_version: str = "0.1.0"
    
    clerk_secret_key: str = ""
    next_public_clerk_publishable_key: str = ""

    model_config = SettingsConfigDict(env_file="/home/drodr10/Websites/AgriCredit/backend/.env", extra="ignore")


settings = Settings()
