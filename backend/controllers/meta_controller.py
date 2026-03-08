from __future__ import annotations

from backend.services import meta_service
from backend.services.data_repository import DataRepository


def get_admin_emails(repository: DataRepository) -> list[str]:
    return meta_service.get_admin_emails(repository)


def get_category_emoji(repository: DataRepository) -> dict[str, str]:
    return meta_service.get_category_emoji(repository)
