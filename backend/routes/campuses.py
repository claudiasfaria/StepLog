from __future__ import annotations

from flask import Blueprint, current_app, jsonify

from backend.controllers.campus_controller import get_all_map_config, get_campuses_payload, get_map_config

campuses_bp = Blueprint("campuses", __name__)


@campuses_bp.get("/api/campuses")
def campuses() -> tuple:
    repository = current_app.config["repository"]
    return jsonify(get_campuses_payload(repository)), 200


@campuses_bp.get("/api/map-config")
def all_map_config() -> tuple:
    repository = current_app.config["repository"]
    return jsonify(get_all_map_config(repository)), 200


@campuses_bp.get("/api/map-config/<campus_id>")
def map_config(campus_id: str) -> tuple:
    repository = current_app.config["repository"]
    return jsonify(get_map_config(repository, campus_id)), 200
