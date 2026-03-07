from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    mongodb_url: str
    mongodb_db: str
    app_title: str
    app_version: str

    clerk_secret_key: str = ""
    next_public_clerk_publishable_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
