"""Keep integration tests from mutating the developer's persisted database."""
import os
import shutil
from pathlib import Path

import pytest


@pytest.fixture(scope="session", autouse=True)
def isolated_database(tmp_path_factory):
    source = Path("data/waste.db")
    target = tmp_path_factory.mktemp("db") / "waste.db"
    if source.exists():
        shutil.copy2(source, target)
    os.environ["DB_PATH"] = str(target)
