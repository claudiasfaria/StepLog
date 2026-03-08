from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    firebase_database_url: str | None
    firebase_auth_token: str | None
    local_seed_path: Path



def load_settings() -> Settings:
    backend_dir = Path(__file__).resolve().parent
    default_seed = backend_dir / "data" / "local_seed.json"

    return Settings(
        firebase_database_url=os.getenv("FIREBASE_DATABASE_URL"),
        firebase_auth_token=os.getenv("FIREBASE_AUTH_TOKEN"),
        local_seed_path=Path(os.getenv("STEPLOG_LOCAL_SEED_PATH", default_seed)),
    )

