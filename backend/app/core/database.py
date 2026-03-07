from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

_client: AsyncIOMotorClient | None = None  # type: ignore[type-arg]


def get_client() -> AsyncIOMotorClient:  # type: ignore[type-arg]
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_url)
    return _client


def get_database() -> AsyncIOMotorDatabase:  # type: ignore[type-arg]
    return get_client()[settings.mongodb_db]


async def close_client() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
