import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Optional

class InsightManager:
    def __init__(self, insights_path: str = "research_insights.json"):
        self.insights_path = insights_path

    def _load_insights(self) -> List[Dict]:
        if not os.path.exists(self.insights_path):
            return []
        try:
            with open(self.insights_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except (json.JSONDecodeError, Exception):
            return []

    def _save_insights(self, insights: List[Dict]):
        with open(self.insights_path, "w", encoding="utf-8") as f:
            json.dump(insights, f, ensure_ascii=False, indent=2)

    def create_insight(self, title: str, summary: str, linked_sessions: List[str] = None, 
                       linked_personas: List[str] = None, supporting_signals: List[str] = None, 
                       market_regimes: List[str] = None, failure_tags: List[str] = None) -> Dict:
        insights = self._load_insights()
        
        new_insight = {
            "insight_id": str(uuid.uuid4()),
            "title": title,
            "summary": summary,
            "linked_sessions": linked_sessions or [],
            "linked_personas": linked_personas or [],
            "supporting_signals": supporting_signals or [],
            "market_regimes": market_regimes or [],
            "failure_tags": failure_tags or [],
            "created_at": datetime.now().isoformat(),
            "confidence": "heuristic",
            "reproducibility": {
                "replay_version": "v1",
                "schema_version": "1.2"
            }
        }
        
        insights.append(new_insight)
        self._save_insights(insights)
        return new_insight

    def list_insights(self) -> List[Dict]:
        return self._load_insights()

    def update_insight(self, insight_id: str, updates: Dict) -> Optional[Dict]:
        insights = self._load_insights()
        updated_insight = None
        for i in insights:
            if i["insight_id"] == insight_id:
                for key, value in updates.items():
                    if key in ["title", "summary", "linked_sessions", "linked_personas", 
                              "supporting_signals", "market_regimes", "failure_tags"]:
                        i[key] = value
                updated_insight = i
                break
        
        if updated_insight:
            self._save_insights(insights)
        return updated_insight

    def get_failure_taxonomy(self) -> List[Dict]:
        """정의된 실패 유형 분류 체계 반환"""
        return [
            {"id": "overconfidence", "label": "Overconfidence", "description": "High confidence despite poor indicator alignment."},
            {"id": "reasoning_loop", "label": "Reasoning Loop", "description": "Repetitive reasoning trace without new insight."},
            {"id": "volatility_blindness", "label": "Volatility Blindness", "description": "Failure to recognize high-risk volatile regimes."},
            {"id": "trend_chasing", "label": "Trend Chasing", "description": "Entering trades at the end of a trend due to recency bias."},
            {"id": "contradictory_analysis", "label": "Contradictory Analysis", "description": "Reasoning trace contradicts the selected action."},
            {"id": "delayed_reversal", "label": "Delayed Reversal Recognition", "description": "Failure to identify mean reversion points in a timely manner."}
        ]

    def generate_session_summary(self, session_id: str, signals: List[Dict]) -> Dict:
        """세션 데이터를 기반으로 자동 요약 생성"""
        if not signals:
            return {"status": "no_data", "summary": "No signals available for this session."}

        # 1. 지배적인 추론 패턴 (가장 많이 사용된 키워드/시그니처)
        all_keywords = []
        for s in signals:
            all_keywords.extend(s.get("evaluation", {}).get("reasoning_signature", []))
        
        from collections import Counter
        top_keywords = [k for k, _ in Counter(all_keywords).most_common(5)]

        # 2. 시장 상황별 성과
        regime_perf = {}
        for s in signals:
            regime = s.get("market_regime", "unknown")
            if regime not in regime_perf: regime_perf[regime] = {"total": 0, "wins": 0}
            regime_perf[regime]["total"] += 1
            if "outcomes" in s and "5m" in s["outcomes"]:
                if s["outcomes"]["5m"]["pct"] > 0:
                    regime_perf[regime]["wins"] += 1
        
        strongest_regime = max(regime_perf.keys(), key=lambda r: regime_perf[r]["wins"]/regime_perf[r]["total"] if regime_perf[r]["total"] > 0 else 0)

        # 3. 빈번한 실패 유형 (품질 점수가 낮은 시그널 분석)
        failure_flags = []
        drifts = []
        for s in signals:
            failure_flags.extend(s.get("evaluation", {}).get("flags", []))
            drifts.append(s.get("evaluation", {}).get("drift_score", 0))
        
        top_failures = [f for f, _ in Counter(failure_flags).most_common(3)]
        avg_drift = sum(drifts) / len(drifts) if drifts else 0

        drift_observation = "Reasoning remained stable."
        if avg_drift > 0.4:
            drift_observation = "Significant reasoning drift observed across session."
        elif avg_drift > 0.2:
            drift_observation = "Moderate reasoning evolution detected."

        return {
            "session_id": session_id,
            "summary": f"Session focused on {', '.join(top_keywords)}. Strongest performance in {strongest_regime} regime. {drift_observation}",
            "top_patterns": top_keywords,
            "strongest_regime": strongest_regime,
            "frequent_failures": top_failures,
            "avg_drift": round(avg_drift, 2),
            "signal_count": len(signals),
            "generated_at": datetime.now().isoformat()
        }
