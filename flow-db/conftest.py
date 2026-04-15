"""Ensure flow-db/ is on sys.path so 'import src' resolves from any pytest invocation."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
