from __future__ import annotations

import json
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen


@dataclass
class FirebaseClient:
    database_url: str | None
    auth_token: str | None = None

    @property
    def enabled(self) -> bool:
        return bool(self.database_url)

    def get_json(self, path: str = "") -> dict | list | None:
        if not self.enabled:
            return None

        base = self.database_url.rstrip("/")
        firebase_path = path.strip("/")
        url = f"{base}/{firebase_path}.json" if firebase_path else f"{base}/.json"
        if self.auth_token:
            url = f"{url}?{urlencode({'auth': self.auth_token})}"

        try:
            with urlopen(url, timeout=4) as response:
                return json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
            # Local development may run without Firebase credentials; fallback is handled by repository.
            return None

