import json
import os
from pathlib import Path

MODELS_ROOT = Path(os.environ.get("MODELS_ROOT", "/models")).resolve()
DATA_DIR = Path(os.environ.get("DATA_DIR", "/data")).resolve()
CATALOG_PATH = Path(
    os.environ.get("CATALOG_PATH", Path(__file__).resolve().parent.parent / "catalog.json")
)
DB_PATH = DATA_DIR / "installations.db"
CUSTOM_BUNDLES_PATH = DATA_DIR / "custom_bundles.json"


def load_catalog() -> dict:
    with open(CATALOG_PATH, encoding="utf-8") as f:
        return json.load(f)
