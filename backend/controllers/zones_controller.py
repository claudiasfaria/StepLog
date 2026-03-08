from __future__ import annotations

from backend.services import zones_service
from backend.services.data_repository import DataRepository


def get_zones(repository: DataRepository, campus_id: str) -> list[dict] | None:
    return zones_service.get_zones(repository, campus_id)


def get_zone_forecast(repository: DataRepository, campus_id: str, zone_id: str) -> list[dict] | None:
    return zones_service.get_zone_forecast(repository, campus_id, zone_id)
