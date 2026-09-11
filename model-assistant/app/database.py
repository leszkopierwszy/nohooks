import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any

from .config import DATA_DIR, DB_PATH


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with get_conn() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS installations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bundle_id TEXT NOT NULL,
                status TEXT NOT NULL,
                files_json TEXT NOT NULL DEFAULT '[]',
                progress_json TEXT NOT NULL DEFAULT '{}',
                error_message TEXT,
                installed_at TEXT,
                uninstalled_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_installations_bundle
                ON installations(bundle_id);
            """
        )
        try:
            conn.execute(
                "ALTER TABLE installations ADD COLUMN progress_json TEXT NOT NULL DEFAULT '{}'"
            )
        except sqlite3.OperationalError:
            pass


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def row_to_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None
    data = dict(row)
    data["files"] = json.loads(data.pop("files_json") or "[]")
    raw_progress = data.pop("progress_json", None) or "{}"
    try:
        data["progress"] = json.loads(raw_progress) if raw_progress else {}
    except json.JSONDecodeError:
        data["progress"] = {}
    return data


def create_installation(bundle_id: str) -> dict[str, Any]:
    now = _utc_now()
    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO installations (bundle_id, status, files_json, created_at, updated_at)
            VALUES (?, 'pending', '[]', ?, ?)
            """,
            (bundle_id, now, now),
        )
        install_id = cur.lastrowid
    return get_installation(install_id)  # type: ignore[return-value]


def get_installation(install_id: int) -> dict[str, Any] | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM installations WHERE id = ?", (install_id,)
        ).fetchone()
    return row_to_dict(row)


def get_active_installation(bundle_id: str) -> dict[str, Any] | None:
    with get_conn() as conn:
        row = conn.execute(
            """
            SELECT * FROM installations
            WHERE bundle_id = ? AND status IN ('pending', 'downloading', 'installed')
            ORDER BY id DESC LIMIT 1
            """,
            (bundle_id,),
        ).fetchone()
    return row_to_dict(row)


def list_installations(limit: int = 50) -> list[dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT * FROM installations
            ORDER BY id DESC LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [row_to_dict(r) for r in rows]  # type: ignore[misc]


def update_installation(install_id: int, **fields: Any) -> None:
    if not fields:
        return
    if "files" in fields:
        fields["files_json"] = json.dumps(fields.pop("files"))
    if "progress" in fields:
        fields["progress_json"] = json.dumps(fields.pop("progress"))
    fields["updated_at"] = _utc_now()
    cols = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [install_id]
    with get_conn() as conn:
        conn.execute(f"UPDATE installations SET {cols} WHERE id = ?", values)
