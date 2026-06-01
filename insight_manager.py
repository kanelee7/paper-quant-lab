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
                       conflicting_signals: List[str] = None,
                       market_regimes: List[str] = None, failure_tags: List[str] = None,
                       status: str = "active") -> Dict:
        insights = self._load_insights()
        
        new_insight = {
            "insight_id": str(uuid.uuid4()),
            "title": title,
            "summary": summary,
            "linked_sessions": linked_sessions or [],
            "linked_personas": linked_personas or [],
            "supporting_signals": supporting_signals or [],
            "conflicting_signals": conflicting_signals or [],
            "market_regimes": market_regimes or [],
            "failure_tags": failure_tags or [],
            "created_at": datetime.now().isoformat(),
            "status": status, # active, archived, contradicted
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

    def get_related_insights(self, signal_id: Optional[str] = None, 
                             session_id: Optional[str] = None, 
                             tags: List[str] = None,
                             market_regime: Optional[str] = None) -> List[Dict]:
        """시그널, 세션, 태그 등을 기반으로 연관된 인사이트 검색"""
        all_insights = self._load_insights()
        related = []
        
        for i in all_insights:
            score = 0
            if signal_id and (signal_id in i.get("supporting_signals", []) or signal_id in i.get("conflicting_signals", [])):
                score += 10
            if session_id and session_id in i.get("linked_sessions", []):
                score += 5
            if market_regime and market_regime in i.get("market_regimes", []):
                score += 3
            
            if tags:
                matching_tags = set(tags) & set(i.get("failure_tags", []))
                score += len(matching_tags) * 2
            
            if score > 0:
                i["relevance_score"] = score
                related.append(i)
        
        return sorted(related, key=lambda x: x["relevance_score"], reverse=True)

    def get_knowledge_compression(self) -> List[Dict]:
        """지식 압축: 반복되는 패턴, 관찰, 모순 요약 생성"""
        insights = self._load_insights()
        summaries = []
        
        # 1. 반복되는 실패 패턴 (Repeated failure pattern)
        from collections import Counter
        all_failures = []
        for i in insights:
            all_failures.extend(i.get("failure_tags", []))
        
        counts = Counter(all_failures)
        for tag, count in counts.items():
            if count >= 2:
                summaries.append({
                    "type": "repeated_failure",
                    "label": f"Repeated Failure: {tag}",
                    "content": f"Detected in {count} separate findings. This pattern suggests a systemic logic gap.",
                    "severity": "high" if count > 3 else "medium"
                })
        
        # 2. 해결되지 않은 모순 (Unresolved contradiction)
        contradicted = [i for i in insights if i.get("status") == "contradicted"]
        if contradicted:
            summaries.append({
                "type": "unresolved_contradiction",
                "label": "Evidence Contradiction",
                "content": f"{len(contradicted)} findings have been flagged as contradicted by new evidence. Review required to refine logic.",
                "severity": "medium"
            })
            
        # 3. 빈번한 관찰 (Recurring observation)
        regimes = []
        for i in insights:
            regimes.extend(i.get("market_regimes", []))
        
        regime_counts = Counter(regimes)
        for regime, count in regime_counts.items():
            if count >= 3:
                summaries.append({
                    "type": "recurring_observation",
                    "label": f"Regime Insight: {regime}",
                    "content": f"Accumulated {count} findings specifically for {regime} regime.",
                    "severity": "low"
                })
                
        return summaries

    def update_insight(self, insight_id: str, updates: Dict) -> Optional[Dict]:
        insights = self._load_insights()
        updated_insight = None
        for i in insights:
            if i["insight_id"] == insight_id:
                for key, value in updates.items():
                    if key in ["title", "summary", "linked_sessions", "linked_personas", 
                              "supporting_signals", "conflicting_signals", "market_regimes", 
                              "failure_tags", "status"]:
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
