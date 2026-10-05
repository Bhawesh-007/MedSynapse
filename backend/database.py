"""Local persistence configuration for structured clinical feature evidence.

SQLite is used for the local development deployment. The schema deliberately
stores the structured extraction payload and a report digest, not the original
uploaded report text, which may contain sensitive patient information.
"""

from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import uuid
from contextlib import contextmanager
from pathlib import Path
from typing import Generator


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATABASE_PATH = PROJECT_ROOT / "data" / "medsynapse.db"


def get_database_path() -> Path:
    """Resolve the SQLite file configured for this deployment."""
    configured_path = os.getenv("MEDSYNAPSE_DATABASE_PATH")
    if not configured_path:
        return DEFAULT_DATABASE_PATH

    path = Path(configured_path).expanduser()
    return path if path.is_absolute() else PROJECT_ROOT / path


@contextmanager
def get_connection() -> Generator[sqlite3.Connection, None, None]:
    """Yield a transaction-safe SQLite connection with foreign keys enabled."""
    database_path = get_database_path()
    database_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def initialize_database() -> Path:
    """Create the local feature-evidence schema if it does not already exist."""
    with get_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS feature_extractions (
                id TEXT PRIMARY KEY,
                report_id TEXT,
                disease_type TEXT NOT NULL,
                source_filename TEXT,
                report_sha256 TEXT NOT NULL,
                features_json TEXT NOT NULL,
                model_features_json TEXT,
                extraction_status TEXT NOT NULL,
                clinician_approval_status TEXT NOT NULL DEFAULT 'pending'
                    CHECK (clinician_approval_status IN ('pending', 'approved', 'rejected')),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_feature_extractions_report_id
                ON feature_extractions(report_id);
            CREATE INDEX IF NOT EXISTS idx_feature_extractions_disease_created
                ON feature_extractions(disease_type, created_at DESC);
            """
        )
    return get_database_path()


def report_sha256(report_text: str) -> str:
    """Return a stable digest for deduplication without persisting report text."""
    return hashlib.sha256(report_text.encode("utf-8")).hexdigest()


def save_feature_extraction(
    *,
    disease_type: str,
    source_filename: str,
    report_text: str,
    features: dict,
    model_features: dict | None,
    extraction_status: str,
) -> str:
    """Persist extracted evidence and return its immutable extraction ID.

    The original OCR text is intentionally not stored. ``report_sha256`` makes
    repeated extractions traceable without copying patient report content into
    the local database.
    """

    extraction_id = str(uuid.uuid4())
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO feature_extractions (
                id, disease_type, source_filename, report_sha256,
                features_json, model_features_json, extraction_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                extraction_id,
                disease_type,
                source_filename or None,
                report_sha256(report_text),
                json.dumps(features, separators=(",", ":"), ensure_ascii=False),
                (
                    json.dumps(model_features, separators=(",", ":"), ensure_ascii=False)
                    if model_features is not None
                    else None
                ),
                extraction_status,
            ),
        )
    return extraction_id


def load_model_features(extraction_id: str, disease_type: str) -> dict:
    """Load inference-ready feature values from the local feature store.

    Raw OCR text is never read by a prediction endpoint. A record must have
    passed the extraction contract and contain its ordered model-feature JSON.
    """
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT disease_type, extraction_status, model_features_json
            FROM feature_extractions
            WHERE id = ?
            """,
            (extraction_id,),
        ).fetchone()

    if row is None:
        raise LookupError("Feature extraction was not found in the local database.")
    if row["disease_type"] != disease_type:
        raise ValueError("Stored features do not belong to the requested disease model.")
    if row["extraction_status"] != "ready_for_inference" or not row["model_features_json"]:
        raise ValueError("Stored features are incomplete or require clinician review before inference.")

    try:
        model_features = json.loads(row["model_features_json"])
    except json.JSONDecodeError as exc:
        raise ValueError("Stored model features are corrupted.") from exc
    if not isinstance(model_features, dict):
        raise ValueError("Stored model features have an invalid format.")
    return model_features
