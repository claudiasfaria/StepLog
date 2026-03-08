from __future__ import annotations

from backend.services import campus_service
from backend.services.data_repository import DataRepository


def get_campuses_payload(repository: DataRepository) -> dict:
    return campus_service.get_campuses_payload(repository)


def get_all_map_config(repository: DataRepository) -> dict:
    return campus_service.get_all_map_config(repository)


def get_map_config(repository: DataRepository, campus_id: str) -> dict:
    return campus_service.get_map_config(repository, campus_id)
