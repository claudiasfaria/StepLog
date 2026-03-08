from __future__ import annotations

from backend.services.data_repository import DataRepository


def get_admin_emails(repository: DataRepository) -> list[str]:
    return repository.get_admin_emails()


def get_category_emoji(repository: DataRepository) -> dict[str, str]:
    return repository.get_category_emoji()

