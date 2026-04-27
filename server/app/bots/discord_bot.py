import asyncio
import os
from typing import Any

from discord import Intents, Message
from discord.ext.commands import Bot
from dotenv import load_dotenv

load_dotenv()

TOKEN: str = os.getenv("DISCORD_BOT_TOKEN", "")

intents: Intents = Intents.default()
intents.message_content = True
client: Bot = Bot(intents=intents, command_prefix="!")

_discord_task: asyncio.Task[Any] | None = None


@client.event
async def on_message(message: Message) -> None:
    """Reply to every message with Hello!."""
    if message.author.bot:
        return
    await message.reply("Hello!")


async def start_bot() -> None:
    """Start the Discord bot as a background task."""
    global _discord_task
    _discord_task = asyncio.create_task(client.start(TOKEN))


async def stop_bot() -> None:
    """Stop the Discord bot."""
    global _discord_task
    if _discord_task:
        _discord_task.cancel()
        try:
            await _discord_task
        except asyncio.CancelledError:
            pass
        _discord_task = None
    await client.close()
