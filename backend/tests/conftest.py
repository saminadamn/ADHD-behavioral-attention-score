"""Make `backend/` importable as the root for `models.*` / `agents.*` imports,
matching how main.py and core/pipeline.py import them (no `backend.` prefix)."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
