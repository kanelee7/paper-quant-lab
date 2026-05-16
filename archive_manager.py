import json
import os
import shutil
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

class ArchiveManager:
    def __init__(self, data_dir: str = ".", archive_root: str = "runtime/archives"):
        self.data_dir = data_dir
        self.archive_root = archive_root
        self.core_files = {
            "journal": "decision_journal.json",
            "sessions": "research_sessions.json",
            "insights": "research_insights.json",
            "reviews": "research_reviews.json",
            "patterns": "research_patterns.json",
            "snapshots": "replay_snapshots.json"
        }
        self.schema_version = "1.6"
        self.replay_version = "v1"
        
        if not os.path.exists(self.archive_root):
            os.makedirs(self.archive_root, exist_ok=True)

    def create_research_archive(self, title: str, description: str = "") -> str:
        """현재 연구 데이터의 전체 아카이브(스냅샷) 생성"""
        archive_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_title = title.replace(" ", "-").lower()
        archive_dir = os.path.join(self.archive_root, f"archive_{timestamp}_{safe_title}")
        os.makedirs(archive_dir, exist_ok=True)

        manifest = {
            "archive_id": archive_id,
            "title": title,
            "description": description,
            "created_at": datetime.now().isoformat(),
            "schema_version": self.schema_version,
            "replay_version": self.replay_version,
            "included_components": []
        }

        for key, filename in self.core_files.items():
            src = os.path.join(self.data_dir, filename)
            if os.path.exists(src):
                dst = os.path.join(archive_dir, filename)
                shutil.copy2(src, dst)
                manifest["included_components"].append(key)

        with open(os.path.join(archive_dir, "manifest.json"), "w", encoding="utf-8") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)

        return archive_dir

    def list_archives(self) -> List[Dict]:
        """사용 가능한 모든 아카이브 목록 조회"""
        if not os.path.exists(self.archive_root):
            return []
            
        archives = []
        for d in os.listdir(self.archive_root):
            path = os.path.join(self.archive_root, d)
            manifest_path = os.path.join(path, "manifest.json")
            if os.path.isdir(path) and os.path.exists(manifest_path):
                try:
                    with open(manifest_path, "r", encoding="utf-8") as f:
                        archives.append(json.load(f))
                except:
                    continue
        
        return sorted(archives, key=lambda x: x["created_at"], reverse=True)

    def validate_archive_integrity(self, archive_dir: str) -> Dict[str, Any]:
        """아카이브 폴더의 무결성 검증"""
        manifest_path = os.path.join(archive_dir, "manifest.json")
        report = {
            "status": "valid",
            "issues": [],
            "schema_match": True,
            "replay_match": True
        }

        if not os.path.exists(manifest_path):
            report["status"] = "invalid"
            report["issues"].append("Manifest file missing")
            return report

        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest = json.load(f)
                
            if manifest.get("schema_version") != self.schema_version:
                report["schema_match"] = False
                report["issues"].append(f"Schema version mismatch: {manifest.get('schema_version')} vs {self.schema_version}")
                
            if manifest.get("replay_version") != self.replay_version:
                report["replay_match"] = False
                report["issues"].append(f"Replay logic version mismatch: {manifest.get('replay_version')} vs {self.replay_version}")

            for comp in manifest.get("included_components", []):
                filename = self.core_files.get(comp)
                if filename and not os.path.exists(os.path.join(archive_dir, filename)):
                    report["status"] = "degraded"
                    report["issues"].append(f"Component data missing: {comp}")
        except:
            report["status"] = "invalid"
            report["issues"].append("Error parsing manifest")

        return report

    def import_archive(self, archive_dir: str, mode: str = "merge") -> bool:
        """아카이브 데이터를 현재 작업 환경으로 수입"""
        # 모드: 'merge' (기존 데이터에 추가), 'overwrite' (기존 데이터 교체)
        if mode not in ["merge", "overwrite"]:
            return False

        # 아카이브 무결성 먼저 체크
        validation = self.validate_archive_integrity(archive_dir)
        if validation["status"] == "invalid":
            return False

        for comp in ["sessions", "insights", "journal"]:
            filename = self.core_files.get(comp)
            archive_file = os.path.join(archive_dir, filename)
            if not os.path.exists(archive_file):
                continue

            with open(archive_file, "r", encoding="utf-8") as f:
                imported_data = json.load(f)

            if mode == "overwrite":
                dst = os.path.join(self.data_dir, filename)
                # 안전을 위해 백업 생성
                if os.path.exists(dst):
                    shutil.copy2(dst, dst + ".pre_import")
                with open(dst, "w", encoding="utf-8") as f:
                    json.dump(imported_data, f, ensure_ascii=False, indent=2)
            else:
                # Merge logic (중복 ID 체크 포함)
                current_file = os.path.join(self.data_dir, filename)
                current_data = []
                if os.path.exists(current_file):
                    with open(current_file, "r", encoding="utf-8") as f:
                        current_data = json.load(f)

                id_key = "id" if comp == "journal" else "session_id" if comp == "sessions" else "insight_id"
                existing_ids = {item.get(id_key) for item in current_data}
                
                merged_count = 0
                for item in imported_data:
                    if item.get(id_key) not in existing_ids:
                        current_data.append(item)
                        merged_count += 1
                
                if merged_count > 0:
                    with open(current_file, "w", encoding="utf-8") as f:
                        json.dump(current_data, f, ensure_ascii=False, indent=2)

        return True
