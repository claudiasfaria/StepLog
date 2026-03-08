from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from backend.services.firebase_client import FirebaseClient


@dataclass
class DataRepository:
    firebase_client: FirebaseClient
    local_seed_path: Path

    def _load_local_seed(self) -> dict[str, Any]:
        with self.local_seed_path.open("r", encoding="utf-8") as file:
            return json.load(file)

    def _load_root(self) -> dict[str, Any]:
        firebase_data = self.firebase_client.get_json("")
        if isinstance(firebase_data, dict) and firebase_data:
            return firebase_data
        return self._load_local_seed()

    def get_campuses_payload(self) -> dict[str, Any]:
        root = self._load_root()
        return {
            "campuses": root.get("campuses", []),
            "enterprise": root.get("enterprise", []),
            "public": root.get("public", {}),
        }

    def get_admin_emails(self) -> list[str]:
        root = self._load_root()
        return [str(email) for email in root.get("adminEmails", [])]

    def get_category_emoji(self) -> dict[str, str]:
        root = self._load_root()
        emoji = root.get("categoryEmoji", {})
        return {str(k): str(v) for k, v in emoji.items()}

    def get_all_map_config(self) -> dict[str, Any]:
        root = self._load_root()
        return root.get("mapConfigByCampus", {})

    def get_default_map_config(self) -> dict[str, Any]:
        root = self._load_root()
        return root.get("defaultMapConfig", {})

    def get_map_config(self, campus_id: str) -> dict[str, Any]:
        all_configs = self.get_all_map_config()
        return all_configs.get(campus_id) or self.get_default_map_config()

    def get_zones(self, campus_id: str) -> list[dict[str, Any]] | None:
        root = self._load_root()
        zones_by_campus = root.get("zonesByCampus", {})
        zones = zones_by_campus.get(campus_id)
        return zones if isinstance(zones, list) else None
