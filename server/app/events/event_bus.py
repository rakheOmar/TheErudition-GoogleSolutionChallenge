from __future__ import annotations

import asyncio
import json
import os
from typing import Any

import aio_pika
from aio_pika import ExchangeType, Message

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
EVENT_EXCHANGE = "logistics_events"

_connection: aio_pika.RobustConnection | None = None
_channel: aio_pika.RobustChannel | None = None


async def get_channel() -> aio_pika.RobustChannel:
    global _connection, _channel
    if _channel and not _channel.is_closed:
        return _channel

    _connection = await aio_pika.connect_robust(RABBITMQ_URL)
    _channel = await _connection.channel()
    await _channel.declare_exchange(EVENT_EXCHANGE, ExchangeType.TOPIC, durable=True)
    return _channel


async def publish_event(routing_key: str, payload: dict[str, Any]) -> None:
    try:
        channel = await get_channel()
        message = Message(
            body=json.dumps(payload).encode(),
            content_type="application/json",
        )
        exchange = await channel.declare_exchange(EVENT_EXCHANGE, ExchangeType.TOPIC, durable=True)
        await exchange.publish(message, routing_key=routing_key)
    except Exception as e:
        print(f"Failed to publish event {routing_key}: {e}")


async def publish_disruption_created(disruption: dict[str, Any]) -> None:
    await publish_event("disruption.created", {
        "event_type": "disruption_created",
        "disruption": disruption,
        "timestamp": disruption.get("id", ""),
    })


async def publish_shipment_updated(shipment: dict[str, Any], recommendation: dict[str, Any]) -> None:
    await publish_event("shipment.updated", {
        "event_type": "shipment_updated",
        "shipment": shipment,
        "recommendation": recommendation,
        "timestamp": shipment.get("id", ""),
    })


async def publish_policy_updated(policy: dict[str, Any]) -> None:
    await publish_event("policy.updated", {
        "event_type": "policy_updated",
        "policy": policy,
        "timestamp": policy.get("id", ""),
    })
