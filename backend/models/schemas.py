from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class CampusConfig:
    id: str
    name: str
    short_name: str
    domain: str
    tagline: str
    color: str
    color_raw: str
    logo: str
    is_public: bool = False

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "CampusConfig":
        return cls(
            id=str(data.get("id", "")),
            name=str(data.get("name", "")),
            short_name=str(data.get("shortName", "")),
            domain=str(data.get("domain", "")),
            tagline=str(data.get("tagline", "")),
            color=str(data.get("color", "#7BC8FF")),
            color_raw=str(data.get("colorRaw", "123,200,255")),
            logo=str(data.get("logo", "🏢")),
            is_public=bool(data.get("isPublic", False)),
        )

    def to_api(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "shortName": self.short_name,
            "domain": self.domain,
            "tagline": self.tagline,
            "color": self.color,
            "colorRaw": self.color_raw,
            "logo": self.logo,
            "isPublic": self.is_public,
        }


@dataclass
class ZoneData:
    data: dict[str, Any]

    def to_api(self) -> dict[str, Any]:
        return dict(self.data)

