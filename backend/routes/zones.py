from __future__ import annotations

from flask import Blueprint, current_app, jsonify

from backend.controllers.zones_controller import get_zone_forecast, get_zones

zones_bp = Blueprint("zones", __name__)


@zones_bp.get("/api/zones/<campus_id>")
def zones(campus_id: str) -> tuple:
    repository = current_app.config["repository"]
    payload = get_zones(repository, campus_id)
    if payload is None:
        return jsonify({"error": f"Campus '{campus_id}' not found"}), 404
    return jsonify(payload), 200


@zones_bp.get("/api/zones/<campus_id>/<zone_id>/forecast")
def forecast(campus_id: str, zone_id: str) -> tuple:
    repository = current_app.config["repository"]
    payload = get_zone_forecast(repository, campus_id, zone_id)
    if payload is None:
        return jsonify({"error": "Zone not found"}), 404
    return jsonify(payload), 200
