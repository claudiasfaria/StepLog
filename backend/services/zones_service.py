from __future__ import annotations

import math
import random
from datetime import date
from typing import Any

from backend.models.schemas import ZoneData
from backend.services.data_repository import DataRepository


def _generate_trend(base_percent: float) -> list[dict[str, float | str]]:
    return [
        {
            "time": f"{i * 15}m",
            "predicted": min(100.0, max(5.0, base_percent + (random.random() - 0.5) * 20 + math.sin(i / 3) * 10)),
        }
        for i in range(12)
    ]


def _ensure_trend(zone: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(zone)
    if "trend" not in normalized or not isinstance(normalized["trend"], list):
        capacity = max(1, int(normalized.get("capacity", 1)))
        occupancy = int(normalized.get("currentOccupancy", 0))
        base = round((occupancy / capacity) * 100)
        normalized["trend"] = _generate_trend(base)
    return ZoneData(normalized).to_api()


def get_zones(repository: DataRepository, campus_id: str) -> list[dict[str, Any]] | None:
    zones = repository.get_zones(campus_id)
    if zones is None:
        return None
    return [_ensure_trend(zone) for zone in zones]


def get_zone_forecast(repository: DataRepository, campus_id: str, zone_id: str) -> list[dict[str, Any]] | None:
    zones = get_zones(repository, campus_id) or []
    zone = next((item for item in zones if item.get("id") == zone_id), None)
    if not zone:
        return None

    capacity = max(1, int(zone.get("capacity", 1)))
    occupancy = int(zone.get("currentOccupancy", 0))
    return generate_daily_forecast(round((occupancy / capacity) * 100))


def generate_daily_forecast(base_occupancy: float) -> list[dict[str, Any]]:
    days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"]
    today = date.today().weekday()
    forecasts = []
    for index, label in enumerate(days):
        forecasts.append(
            {
                "label": label,
                "isToday": index == today,
                "peak": round(min(100.0, base_occupancy + (random.random() - 0.3) * 30)),
                "bestHour": math.floor(random.random() * 4) + 8,
                "hours": [
                    {
                        "h": hour + 7,
                        "v": min(
                            1.0,
                            max(
                                0.05,
                                (base_occupancy / 100)
                                + (random.random() - 0.5) * 0.4
                                + math.sin((hour - 4) / 2.5) * 0.25,
                            ),
                        ),
                    }
                    for hour in range(16)
                ],
            }
        )
    return forecasts

