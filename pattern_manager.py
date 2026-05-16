import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

class PatternManager:
    def __init__(self, patterns_path: str = "research_patterns.json"):
        self.patterns_path = patterns_path

    def _load_patterns(self) -> List[Dict]:
        if not os.path.exists(self.patterns_path):
            return []
        try:
            with open(self.patterns_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except (json.JSONDecodeError, Exception):
            return []

    def _save_patterns(self, patterns: List[Dict]):
        with open(self.patterns_path, "w", encoding="utf-8") as f:
            json.dump(patterns, f, ensure_ascii=False, indent=2)

    def create_pattern_archetype(self, title: str, description: str, 
                                linked_failure_types: List[str] = None,
                                linked_replay_ids: List[str] = None,
                                linked_personas: List[str] = None) -> Dict:
        patterns = self._load_patterns()
        
        new_pattern = {
            "pattern_id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "created_at": datetime.now().isoformat(),
            "linked_failure_types": linked_failure_types or [],
            "linked_replay_ids": linked_replay_ids or [],
            "linked_personas": linked_personas or [],
            "metadata": {
                "schema_version": "1.5",
                "replay_version": "v1"
            }
        }
        
        patterns.append(new_pattern)
        self._save_patterns(patterns)
        return new_pattern

    def list_patterns(self) -> List[Dict]:
        return self._load_patterns()

    def get_pattern_library_presets(self) -> List[Dict]:
        """정의된 핵심 분석 패턴 아키타입 라이브러리 반환"""
        return [
            {
                "id": "volatility_blindness",
                "title": "Volatility Blindness",
                "description": "Failure to recognize high-risk volatile regimes, leading to aggressive entries in unstable conditions."
            },
            {
                "id": "overconfidence_loop",
                "title": "Overconfidence Loop",
                "description": "Repeated high-confidence signals despite consistent negative outcomes in specific regimes."
            },
            {
                "id": "trend_chasing",
                "title": "Trend Chasing",
                "description": "Entering trades at the absolute end of a long trend due to recency bias in reasoning."
            },
            {
                "id": "delayed_reversal",
                "title": "Delayed Reversal Recognition",
                "description": "Persistence in a trend-following mindset after clear technical reversal signs have appeared."
            }
        ]

    def generate_comparative_stats(self, target_ids: List[str], target_type: str = "persona") -> Dict:
        """페르소나 또는 장세 간의 비교 연구 데이터 생성"""
        # (이전 ReviewManager의 종단적 분석 로직과 유사하되 비교에 특화됨)
        # 실제 구현에서는 journal_data를 로드하여 필터링 및 그룹화 수행
        return {
            "target_type": target_type,
            "comparison_groups": target_ids,
            "generated_at": datetime.now().isoformat()
        }
