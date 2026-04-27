from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI

from app.bots.discord_bot import start_bot as start_discord, stop_bot as stop_discord
from app.bots.telegram_bot import start_bot as start_telegram, stop_bot as stop_telegram
from app.routes import health


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Manage application lifecycle: start bots on startup, stop on shutdown."""
    await start_telegram()
    await start_discord()
    yield
    await stop_telegram()
    await stop_discord()


app = FastAPI(docs_url="/docs", redoc_url="/redoc", lifespan=lifespan)

app.include_router(health.router)


@app.get("/")
async def read_root() -> dict[str, str]:
    """Root endpoint returning a greeting."""
    return {"message": "Hello World"}
