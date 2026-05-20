#!/usr/bin/env python3
"""Wrapper — runs the shared snap_window.py next to snap.py."""
from __future__ import annotations

import runpy
import sys
from pathlib import Path

_SCRIPT = Path(__file__).resolve().parents[2] / "python" / "snap_window.py"
if not _SCRIPT.is_file():
    print(f"Missing {_SCRIPT}", file=sys.stderr)
    sys.exit(1)

sys.argv[0] = str(_SCRIPT)
runpy.run_path(str(_SCRIPT), run_name="__main__")
