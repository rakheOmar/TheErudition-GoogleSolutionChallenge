from __future__ import annotations

import os
from dataclasses import dataclass

import aiohttp


@dataclass
class WeatherInfo:
    city: str
    temp_c: float
    humidity: int
    wind_speed: float
    weather_code: int
    description: str


class WeatherClient:
    def __init__(self) -> None:
        self._base_url = "https://api.open-meteo.com/v1/forecast"
        self._enabled = True

    def is_enabled(self) -> bool:
        return True

    async def get_weather(self, lat: float, lon: float, city_name: str = "") -> WeatherInfo | None:
        url = self._base_url
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
            "timezone": "auto",
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        current = data.get("current", {})
                        code = current.get("weather_code", 0)
                        return WeatherInfo(
                            city=city_name,
                            temp_c=current.get("temperature_2m", 0),
                            humidity=int(current.get("relative_humidity_2m", 0)),
                            wind_speed=current.get("wind_speed_10m", 0),
                            weather_code=code,
                            description=self._code_to_description(code),
                        )
        except Exception as e:
            print(f"Weather API error: {e}")

        return None

    def _code_to_description(self, code: int) -> str:
        codes = {
            0: "clear sky",
            1: "mainly clear",
            2: "partly cloudy",
            3: "overcast",
            45: "fog",
            48: "depositing rime fog",
            51: "light drizzle",
            53: "moderate drizzle",
            55: "dense drizzle",
            61: "slight rain",
            63: "moderate rain",
            65: "heavy rain",
            71: "slight snow",
            73: "moderate snow",
            75: "heavy snow",
            80: "slight rain showers",
            81: "moderate rain showers",
            82: "violent rain showers",
            95: "thunderstorm",
            96: "thunderstorm with hail",
            99: "thunderstorm with heavy hail",
        }
        return codes.get(code, "unknown")


weather_client = WeatherClient()