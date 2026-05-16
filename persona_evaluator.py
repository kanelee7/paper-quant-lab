import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
import numpy as np

class PersonaEvaluator:
    def __init__(self, journal_path: str = "decision_journal.json"):
        self.journal_path = journal_path

    def _load_journal(self) -> List[Dict]:
        if not os.path.exists(self.journal_path):
            return []
        try:
            with open(self.journal_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def evaluate_reasoning_quality(self, signal: Dict) -> Dict:
        """분석 결과(Reasoning)의 품질을 평가하는 휴리스틱"""
        trace = signal.get("reasoning_trace", "")
        indicators = signal.get("indicators_snapshot", {})
        
        # 시그니처 및 드리프트 계산 추가
        signature = self.calculate_reasoning_signature(trace)
        drift = self.calculate_drift(signal.get("persona_id", "default"), signature)
        
        scores = {
            "length_score": min(len(trace) / 100, 1.0), # 100자 이상이면 만점
            "indicator_score": 1.0 if indicators else 0.0,
            "clarity_score": 0.8 if "because" in trace.lower() or "due to" in trace.lower() else 0.5,
            "consistency_flag": True # Placeholder
        }
        
        quality_score = (scores["length_score"] * 0.4 + 
                         scores["indicator_score"] * 0.4 + 
                         scores["clarity_score"] * 0.2)
        
        evaluation = {
            "quality_score": round(quality_score, 2),
            "drift_score": drift,
            "reasoning_signature": signature,
            "flags": [],
            "metrics": scores
        }
        
        if len(trace) < 20:
            evaluation["flags"].append("reasoning_too_short")
        if not indicators:
            evaluation["flags"].append("no_indicators_referenced")
        if drift > 0.5:
            evaluation["flags"].append("high_reasoning_drift")
            
        return evaluation

    def calculate_reasoning_signature(self, trace: str) -> List[str]:
        """추론 트레이스에서 핵심 키워드 추출 (간단한 휴리스틱)"""
        if not trace: return []
        words = trace.lower().replace(".", "").replace(",", "").replace(":", "").split()
        # 5자 이상의 유니크한 단어만 추출하여 시그니처 생성
        keywords = [w for w in words if len(w) > 4]
        return sorted(list(set(keywords)))[:10]

    def calculate_drift(self, persona_id: str, current_signature: List[str]) -> float:
        """이전 시그널들과 비교하여 추론 방식의 변화(Drift)를 계산 (Jaccard Distance)"""
        journal = self._load_journal()
        persona_signals = [s for s in journal if s.get("persona_id") == persona_id]
        
        if not persona_signals:
            return 0.0
            
        # 최근 10개 시그널의 시그니처와 비교
        past_signatures = [s.get("evaluation", {}).get("reasoning_signature", []) for s in persona_signals[-10:]]
        # 빈 시그니처 제외
        past_signatures = [ps for ps in past_signatures if ps]
        
        if not past_signatures:
            return 0.0
            
        similarities = []
        curr_set = set(current_signature)
        for past in past_signatures:
            past_set = set(past)
            intersection = len(curr_set & past_set)
            union = len(curr_set | past_set)
            similarity = intersection / union if union > 0 else 1.0
            similarities.append(similarity)
            
        avg_similarity = sum(similarities) / len(similarities)
        return round(1.0 - avg_similarity, 2)

    def find_similar_reasoning(self, signal_id: str, limit: int = 3) -> List[Dict]:
        """특정 시그널과 유사한 추론 패턴을 가진 과거 사례 탐색"""
        journal = self._load_journal()
        target_signal = next((s for s in journal if s.get("id") == signal_id), None)
        
        if not target_signal:
            return []
            
        target_sig = set(target_signal.get("evaluation", {}).get("reasoning_signature", []))
        if not target_sig:
            return []
            
        similar_signals = []
        for s in journal:
            if s.get("id") == signal_id: continue
            
            s_sig = set(s.get("evaluation", {}).get("reasoning_signature", []))
            if not s_sig: continue
            
            intersection = len(target_sig & s_sig)
            union = len(target_sig | s_sig)
            similarity = intersection / union if union > 0 else 0.0
            
            if similarity > 0.3: # 최소 유사도 임계값
                similar_signals.append({
                    "id": s.get("id"),
                    "timestamp": s.get("timestamp"),
                    "persona_id": s.get("persona_id"),
                    "action": s.get("action"),
                    "similarity": round(similarity, 2),
                    "reasoning_trace": s.get("reasoning_trace")
                })
                
        # 유사도 순 정렬
        similar_signals.sort(key=lambda x: x["similarity"], reverse=True)
        return similar_signals[:limit]

    def evaluate_consistency(self, persona_id: str) -> Dict:
        """페르소나의 일관성을 평가"""
        journal = self._load_journal()
        persona_signals = [s for s in journal if s.get("persona_id") == persona_id]
        
        if len(persona_signals) < 5:
            return {"consistency_score": 0, "status": "insufficient_data"}
            
        # 1. 시그널 반복률 (Reasoning이 얼마나 겹치는지)
        traces = [s.get("reasoning_trace", "") for s in persona_signals]
        unique_traces = set(traces)
        repeat_rate = 1.0 - (len(unique_traces) / len(traces))
        
        # 2. 시장 상황(Regime)별 행동 일관성
        regime_actions = {} # regime -> List[action]
        for s in persona_signals:
            regime = s.get("market_regime", "unknown")
            action = s.get("action", "hold")
            if regime not in regime_actions:
                regime_actions[regime] = []
            regime_actions[regime].append(action)
            
        regime_consistency = []
        for regime, actions in regime_actions.items():
            if len(actions) < 2: continue
            # 가장 많이 나타난 액션의 비율
            most_common = max(set(actions), key=actions.count)
            consistency = actions.count(most_common) / len(actions)
            regime_consistency.append(consistency)
            
        avg_regime_consistency = sum(regime_consistency) / len(regime_consistency) if regime_consistency else 0.5
        
        # 종합 일관성 점수
        consistency_score = (avg_regime_consistency * 0.7 + (1 - repeat_rate) * 0.3)
        
        return {
            "consistency_score": round(consistency_score, 2),
            "repeat_rate": round(repeat_rate, 2),
            "regime_consistency": round(avg_regime_consistency, 2),
            "sample_size": len(persona_signals),
            "status": "evaluated"
        }

    def correlate_outcomes(self, persona_id: str) -> List[Dict]:
        """페르소나별 성과 상관관계 분석"""
        journal = self._load_journal()
        persona_signals = [s for s in journal if s.get("persona_id") == persona_id]
        
        correlations = []
        regimes = ["trending", "volatile", "sideways"]
        
        for regime in regimes:
            regime_signals = [s for s in persona_signals if s.get("market_regime") == regime]
            if not regime_signals: continue
            
            outcomes = []
            for s in regime_signals:
                if "outcomes" in s and "5m" in s["outcomes"]:
                    outcomes.append(s["outcomes"]["5m"]["pct"])
            
            if outcomes:
                avg_return = sum(outcomes) / len(outcomes)
                win_rate = len([o for o in outcomes if o > 0]) / len(outcomes)
                correlations.append({
                    "regime": regime,
                    "avg_return_5m": round(avg_return, 4),
                    "win_rate": round(win_rate * 100, 2),
                    "sample_size": len(regime_signals)
                })
                
        return correlations

    def generate_full_report(self, persona_id: str) -> Dict:
        """페르소나에 대한 전체 평가 리포트 생성"""
        consistency = self.evaluate_consistency(persona_id)
        outcomes = self.correlate_outcomes(persona_id)
        
        return {
            "persona_id": persona_id,
            "timestamp": datetime.now().isoformat(),
            "consistency": consistency,
            "outcome_correlations": outcomes,
            "overall_rating": "N/A" # 추후 구현
        }
