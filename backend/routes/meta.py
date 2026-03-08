from __future__ import annotations

from flask import Blueprint, current_app, jsonify

from backend.controllers.meta_controller import get_admin_emails, get_category_emoji

meta_bp = Blueprint("meta", __name__)


@meta_bp.get("/api/admin-emails")
def admin_emails() -> tuple:
    repository = current_app.config["repository"]
    return jsonify(get_admin_emails(repository)), 200


@meta_bp.get("/api/category-emoji")
def category_emoji() -> tuple:
    repository = current_app.config["repository"]
    return jsonify(get_category_emoji(repository)), 200
