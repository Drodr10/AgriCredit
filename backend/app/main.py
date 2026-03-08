from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import close_client
from app.routers import credit_applications, farmers, report_generator, users
from app.routers.ml import analyze


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    yield
    await close_client()


app = FastAPI(
    title=settings.app_title,
    version=settings.app_version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(farmers.router)
app.include_router(users.router)
app.include_router(credit_applications.router)
app.include_router(report_generator.router)
app.include_router(analyze.router)


@app.get("/", tags=["health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_title}
