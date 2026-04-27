import asyncio
import os
from typing import Any

from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

load_dotenv()

TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")

application: Application = Application.builder().token(TOKEN).build()

_telegram_task: asyncio.Task[Any] | None = None


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the /start command."""
    await update.message.reply_text("Hello!")


application.add_handler(CommandHandler("start", start))


async def start_bot() -> None:
    """Initialize and start polling as a background task."""
    global _telegram_task
    await application.initialize()
    await application.start()
    _telegram_task = asyncio.create_task(application.updater.start_polling())


async def stop_bot() -> None:
    """Gracefully shut down the bot."""
    global _telegram_task
    if _telegram_task:
        _telegram_task.cancel()
        try:
            await _telegram_task
        except asyncio.CancelledError:
            pass
        _telegram_task = None
    await application.stop()
    await application.shutdown()
