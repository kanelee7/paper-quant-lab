import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

class ReplaySnapshotManager:
    def __init__(self, snapshots_path: str = "replay_snapshots.json"):
        self.snapshots_path = snapshots_path

    def _load_snapshots(self) -> List[Dict]:
        if not os.path.exists(self.snapshots_path):
            return []
        try:
            with open(self.snapshots_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except (json.JSONDecodeError, Exception):
            return []

    def _save_snapshots(self, snapshots: List[Dict]):
        with open(self.snapshots_path, "w", encoding="utf-8") as f:
            json.dump(snapshots, f, ensure_ascii=False, indent=2)

    def create_snapshot(self, title: str, symbol: str, timestamp: str, signals: List[str], notes: str = "") -> Dict:
        snapshots = self._load_snapshots()
        
        new_snapshot = {
            "snapshot_id": str(uuid.uuid4()),
            "title": title,
            "symbol": symbol,
            "timestamp": timestamp,
            "signal_ids": signals,
            "notes": notes,
            "created_at": datetime.now().isoformat(),
            "metadata": {
                "schema_version": "1.6",
                "replay_version": "v1"
            }
        }
        
        snapshots.append(new_snapshot)
        self._save_snapshots(snapshots)
        return new_snapshot

    def list_snapshots(self) -> List[Dict]:
        return self._load_snapshots()

    def get_snapshot(self, snapshot_id: str) -> Optional[Dict]:
        snapshots = self._load_snapshots()
        return next((s for s in snapshots if s["snapshot_id"] == snapshot_id), None)

    def delete_snapshot(self, snapshot_id: str) -> bool:
        snapshots = self._load_snapshots()
        initial_len = len(snapshots)
        snapshots = [s for s in snapshots if s["snapshot_id"] != snapshot_id]
        if len(snapshots) < initial_len:
            self._save_snapshots(snapshots)
            return True
        return False
