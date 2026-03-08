from __future__ import annotations

from flask import Flask

from backend.routes.campuses import campuses_bp
from backend.routes.meta import meta_bp
from backend.routes.zones import zones_bp



def register_routes(app: Flask) -> None:
    app.register_blueprint(campuses_bp)
    app.register_blueprint(meta_bp)
    app.register_blueprint(zones_bp)
