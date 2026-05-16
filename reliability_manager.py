import json
import os
import shutil
from datetime import datetime
from typing import List, Dict, Any, Optional

class ReliabilityManager:
    def __init__(self, data_dir: str = "."):
        self.data_dir = data_dir
        self.backup_dir = os.path.join(data_dir, "runtime", "backups")
        self.files_to_track = {
            "journal": "decision_journal.json",
            "sessions": "research_sessions.json",
            "insights": "research_insights.json",
            "reviews": "research_reviews.json",
            "patterns": "research_patterns.json",
            "snapshots": "replay_snapshots.json"
        }
        self.schema_version = "1.6"
        self.replay_version = "v1"
        
        if not os.path.exists(self.backup_dir):
            os.makedirs(self.backup_dir, exist_ok=True)

    def validate_integrity(self) -> Dict[str, Any]:
        """모든 연구 데이터 파일의 무결성 및 재현성 검사 수행"""
        report = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "schema_version": self.schema_version,
            "replay_version": self.replay_version,
            "details": {},
            "broken_links": []
        }
        
        # 데이터 로드
        journal = self._safe_load("journal")
        sessions = self._safe_load("sessions")
        insights = self._safe_load("insights")
        
        journal_ids = {s.get("id") for s in journal if isinstance(s, dict)}
        session_ids = {s.get("session_id") for s in sessions if isinstance(s, dict)}
        
        for key, filename in self.files_to_track.items():
            filepath = os.path.join(self.data_dir, filename)
            file_report = {"exists": os.path.exists(filepath), "entries": 0, "issues": []}
            
            data = []
            if file_report["exists"]:
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if not isinstance(data, list):
                            file_report["issues"].append("File content is not a list")
                        else:
                            file_report["entries"] = len(data)
                            for i, entry in enumerate(data):
                                if not isinstance(entry, dict):
                                    file_report["issues"].append(f"Entry {i} is not an object")
                                    continue

                                if key == "journal":
                                    sig_id = entry.get("id")
                                    if not sig_id or "timestamp" not in entry:
                                        file_report["issues"].append(f"Entry {i} missing ID or timestamp")
                                    
                                    # Replay Determinism Check
                                    if "indicators_snapshot" not in entry:
                                        file_report["issues"].append(f"Signal {sig_id}: Missing indicators snapshot (breaks replay)")
                                    
                                elif key == "sessions":
                                    s_id = entry.get("session_id")
                                    if not s_id:
                                        file_report["issues"].append(f"Session {i} missing session_id")
                                    
                                    # Broken Replay Bookmark Check
                                    for b_id in entry.get("bookmarks", []):
                                        if b_id not in journal_ids:
                                            report["broken_links"].append({
                                                "type": "session_bookmark",
                                                "parent": s_id,
                                                "target": b_id,
                                                "issue": "Orphaned bookmark reference"
                                            })

                                elif key == "insights":
                                    ins_id = entry.get("insight_id")
                                    if not ins_id:
                                        file_report["issues"].append(f"Insight {i} missing insight_id")
                                    
                                    # Evidence Link Validation
                                    for s_ref in entry.get("linked_sessions", []):
                                        if s_ref not in session_ids:
                                            report["broken_links"].append({
                                                "type": "insight_session_link",
                                                "parent": ins_id,
                                                "target": s_ref,
                                                "issue": "Linked session not found"
                                            })
                                    
                                    for g_ref in entry.get("supporting_signals", []):
                                        if g_ref not in journal_ids:
                                            report["broken_links"].append({
                                                "type": "insight_signal_evidence",
                                                "parent": ins_id,
                                                "target": g_ref,
                                                "issue": "Supporting signal evidence missing"
                                            })
                except json.JSONDecodeError:
                    file_report["issues"].append("Malformed JSON")
                except Exception as e:
                    file_report["issues"].append(f"Error reading file: {str(e)}")
            else:
                self.recover_missing_file(key)
                file_report["issues"].append("File missing, created empty replacement")
            
            if file_report["issues"]:
                report["status"] = "degraded"
            
            report["details"][key] = file_report
            
        if report["broken_links"]:
            report["status"] = "degraded"
            
        return report

    def _safe_load(self, key: str) -> List:
        filename = self.files_to_track.get(key)
        if not filename: return []
        filepath = os.path.join(self.data_dir, filename)
        if not os.path.exists(filepath): return []
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except:
            return []

    def recover_missing_file(self, key: str):
        """누락된 파일을 빈 리스트로 초기화하여 복구"""
        filename = self.files_to_track.get(key)
        if filename:
            filepath = os.path.join(self.data_dir, filename)
            try:
                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump([], f)
                return True
            except Exception:
                return False
        return False

    def create_backup(self) -> Optional[str]:
        """모든 연구 데이터를 포함한 타임스탬프 백업 생성"""
        timestamp = datetime.now().strftime("%Y%m%dT%H%M%S")
        backup_subdir = os.path.join(self.backup_dir, f"backup_{timestamp}")
        os.makedirs(backup_subdir, exist_ok=True)
        
        copied_files = []
        for key, filename in self.files_to_track.items():
            src = os.path.join(self.data_dir, filename)
            if os.path.exists(src):
                dst = os.path.join(backup_subdir, filename)
                shutil.copy2(src, dst)
                copied_files.append(filename)
        
        if not copied_files:
            os.rmdir(backup_subdir)
            return None
            
        return backup_subdir

    def list_backups(self) -> List[Dict]:
        """사용 가능한 백업 목록 조회"""
        if not os.path.exists(self.backup_dir):
            return []
            
        backups = []
        for d in os.listdir(self.backup_dir):
            path = os.path.join(self.backup_dir, d)
            if os.path.isdir(path) and d.startswith("backup_"):
                backups.append({
                    "id": d,
                    "timestamp": datetime.strptime(d.replace("backup_", ""), "%Y%m%dT%H%M%S").isoformat(),
                    "path": path
                })
        
        return sorted(backups, key=lambda x: x["timestamp"], reverse=True)

    def restore_backup(self, backup_id: str) -> bool:
        """특정 백업에서 데이터 복구"""
        backup_path = os.path.join(self.backup_dir, backup_id)
        if not os.path.exists(backup_path):
            return False
            
        for key, filename in self.files_to_track.items():
            src = os.path.join(backup_path, filename)
            if os.path.exists(src):
                dst = os.path.join(self.data_dir, filename)
                # 복구 전 현재 파일 백업 (안전장치)
                if os.path.exists(dst):
                    shutil.move(dst, dst + ".pre_restore")
                shutil.copy2(src, dst)
                
        return True
