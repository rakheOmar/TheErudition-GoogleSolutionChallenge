from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

import aiohttp
from dotenv import load_dotenv

load_dotenv()


@dataclass
class RouteInfo:
    distance_km: float
    duration_minutes: float
    duration_text: str
    distance_text: str


class GoogleMapsClient:
    def __init__(self) -> None:
        self._api_key = os.getenv("GOOGLE_MAPS_API_KEY", "")
        self._base_url = "https://maps.googleapis.com/maps/api"
        self._enabled = bool(self._api_key)

    def is_enabled(self) -> bool:
        return self._enabled

    async def get_distance_matrix(
        self,
        origins: list[str],
        destinations: list[str],
    ) -> dict[str, Any] | None:
        if not self._enabled:
            return None

        origin_str = "|".join(origins)
        dest_str = "|".join(destinations)

        url = f"{self._base_url}/distancematrix/json"
        params = {
            "origins": origin_str,
            "destinations": dest_str,
            "key": self._api_key,
            "units": "metric",
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    if resp.status == 200:
                        return await resp.json()
        except Exception as e:
            print(f"Google Maps API error: {e}")

        return None

    async def get_route_info(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
    ) -> RouteInfo | None:
        if not self._enabled:
            return None

        origins = [f"{origin_lat},{origin_lng}"]
        destinations = [f"{dest_lat},{dest_lng}"]

        result = await self.get_distance_matrix(origins, destinations)
        if not result:
            return None

        try:
            rows = result.get("rows", [])
            if not rows:
                return None

            elements = rows[0].get("elements", [])
            if not elements:
                return None

            element = elements[0]
            if element.get("status") != "OK":
                return None

            distance = element.get("distance", {})
            duration = element.get("duration", {})

            return RouteInfo(
                distance_km=distance.get("value", 0) / 1000,
                duration_minutes=duration.get("value", 0) / 60,
                duration_text=duration.get("text", ""),
                distance_text=distance.get("text", ""),
            )
        except (KeyError, IndexError):
            return None


maps_client = GoogleMapsClient()