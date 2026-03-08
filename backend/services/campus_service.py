from __future__ import annotations

from backend.models.schemas import CampusConfig
from backend.services.data_repository import DataRepository


def get_campuses_payload(repository: DataRepository) -> dict:
    payload = repository.get_campuses_payload()
    payload["campuses"] = [CampusConfig.from_dict(campus).to_api() for campus in payload["campuses"]]
    payload["enterprise"] = [CampusConfig.from_dict(campus).to_api() for campus in payload["enterprise"]]
    payload["public"] = CampusConfig.from_dict(payload["public"]).to_api()
    return payload


def get_all_map_config(repository: DataRepository) -> dict:
    return repository.get_all_map_config()


def get_map_config(repository: DataRepository, campus_id: str) -> dict:
    return repository.get_map_config(campus_id)

