from __future__ import annotations

from flask import Flask

from backend.config import load_settings
from backend.routes import register_routes
from backend.services.data_repository import DataRepository
from backend.services.firebase_client import FirebaseClient


def create_app() -> Flask:
    app = Flask(__name__)
    settings = load_settings()

    repository = DataRepository(
        firebase_client=FirebaseClient(
            database_url=settings.firebase_database_url,
            auth_token=settings.firebase_auth_token,
        ),
        local_seed_path=settings.local_seed_path,
    )
    app.config["repository"] = repository

    @app.after_request
    def add_cors(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response

    @app.get("/")
    def home() -> str:
        return "StepLog API - running"

    register_routes(app)
    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
