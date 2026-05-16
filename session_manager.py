import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Optional

class SessionManager:
    def __init__(self, sessions_path: str = "research_sessions.json"):
        self.sessions_path = sessions_path
        self.active_session_id: Optional[str] = None

    def _load_sessions(self) -> List[Dict]:
        if not os.path.exists(self.sessions_path):
            return []
        try:
            with open(self.sessions_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except (json.JSONDecodeError, Exception):
            # 파일이 손상된 경우 빈 리스트 반환 (무결성 검사에서 감지됨)
            return []

    def _save_sessions(self, sessions: List[Dict]):
        with open(self.sessions_path, "w", encoding="utf-8") as f:
            json.dump(sessions, f, ensure_ascii=False, indent=2)

    def create_session(self, title: str, asset_type: str, market: str, personas: List[str], notes: str = "", tags: List[str] = None) -> Dict:
        sessions = self._load_sessions()
        
        # 이전 활성 세션 종료 처리
        for s in sessions:
            if s.get("status") == "active":
                s["status"] = "completed"
                s["ended_at"] = datetime.now().isoformat()

        new_session = {
            "session_id": str(uuid.uuid4()),
            "title": title,
            "created_at": datetime.now().isoformat(),
            "ended_at": None,
            "status": "active",
            "asset_type": asset_type,
            "market": market,
            "personas": personas,
            "notes": notes,
            "tags": tags or [],
            "bookmarks": [], # List of signal IDs
            "reproducibility": {
                "replay_version": "v1",
                "schema_version": "1.2",
                "research_environment": "local"
            }
        }
        
        sessions.append(new_session)
        self._save_sessions(sessions)
        self.active_session_id = new_session["session_id"]
        return new_session

    def stop_active_session(self) -> Optional[Dict]:
        sessions = self._load_sessions()
        stopped_session = None
        for s in sessions:
            if s.get("status") == "active":
                s["status"] = "completed"
                s["ended_at"] = datetime.now().isoformat()
                stopped_session = s
        
        if stopped_session:
            self._save_sessions(sessions)
            self.active_session_id = None
        return stopped_session

    def get_active_session(self) -> Optional[Dict]:
        sessions = self._load_sessions()
        for s in sessions:
            if s.get("status") == "active":
                self.active_session_id = s["session_id"]
                return s
        return None

    def list_sessions(self) -> List[Dict]:
        return self._load_sessions()

    def update_session(self, session_id: str, updates: Dict) -> Optional[Dict]:
        sessions = self._load_sessions()
        updated_session = None
        for s in sessions:
            if s["session_id"] == session_id:
                for key, value in updates.items():
                    if key in ["title", "notes", "tags", "bookmarks"]:
                        s[key] = value
                updated_session = s
                break
        
        if updated_session:
            self._save_sessions(sessions)
        return updated_session

    def add_bookmark(self, session_id: str, signal_id: str) -> bool:
        sessions = self._load_sessions()
        for s in sessions:
            if s["session_id"] == session_id:
                if "bookmarks" not in s:
                    s["bookmarks"] = []
                if signal_id not in s["bookmarks"]:
                    s["bookmarks"].append(signal_id)
                    self._save_sessions(sessions)
                    return True
        return False
