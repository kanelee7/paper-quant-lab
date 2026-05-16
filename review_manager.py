import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from collections import Counter

class ReviewManager:
    def __init__(self, reviews_path: str = "research_reviews.json"):
        self.reviews_path = reviews_path

    def _load_reviews(self) -> List[Dict]:
        if not os.path.exists(self.reviews_path):
            return []
        try:
            with open(self.reviews_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except (json.JSONDecodeError, Exception):
            return []

    def _save_reviews(self, reviews: List[Dict]):
        with open(self.reviews_path, "w", encoding="utf-8") as f:
            json.dump(reviews, f, ensure_ascii=False, indent=2)

    def create_review(self, title: str, summary: str, linked_sessions: List[str] = None, 
                      linked_insights: List[str] = None, key_findings: List[str] = None, 
                      failure_patterns: List[str] = None, scope: str = "multi-session") -> Dict:
        reviews = self._load_reviews()
        
        new_review = {
            "review_id": str(uuid.uuid4()),
            "title": title,
            "summary": summary,
            "linked_sessions": linked_sessions or [],
            "linked_insights": linked_insights or [],
            "key_findings": key_findings or [],
            "failure_patterns": failure_patterns or [],
            "created_at": datetime.now().isoformat(),
            "review_scope": scope,
            "reproducibility": {
                "replay_version": "v1",
                "schema_version": "1.4"
            },
            "governance": {
                "evidence_coverage_score": 0.0,
                "reliability_flags": [],
                "audit_trail": {
                    "version": 1,
                    "last_updated": datetime.now().isoformat(),
                    "synthesis_method": "heuristic_summary_v1"
                }
            }
        }
        
        # 신뢰도 초기 계산
        new_review["governance"]["evidence_coverage_score"] = self._calculate_coverage(new_review)
        
        reviews.append(new_review)
        self._save_reviews(reviews)
        return new_review

    def _calculate_coverage(self, review: Dict) -> float:
        """증거 범위 점수 계산 (휴리스틱)"""
        sessions = len(review.get("linked_sessions", []))
        insights = len(review.get("linked_insights", []))
        findings = len(review.get("key_findings", []))
        
        if sessions == 0: return 0.0
        
        # 기본 점수: 세션, 인사이트, 발견 항목 수 기반
        base_score = (min(sessions, 5) * 0.4) + (min(insights, 3) * 0.3) + (min(findings, 5) * 0.3)
        
        # 증거 신호가 아예 없는 세션이 있는지 체크 (간단한 무결성 체크)
        # 실제로는 시그널 데이터를 로드해서 체크해야 함
        
        return round(min(base_score / 4.0, 1.0), 2)

    def update_review(self, review_id: str, updates: Dict) -> Optional[Dict]:
        """기존 회고 내러티브 업데이트 및 감사 추적 갱신"""
        reviews = self._load_reviews()
        updated_review = None
        for r in reviews:
            if r["review_id"] == review_id:
                for key, value in updates.items():
                    if key in ["title", "summary", "linked_sessions", "linked_insights", "key_findings", "failure_patterns"]:
                        r[key] = value
                
                # 감사 추적 갱신
                r["governance"]["audit_trail"]["version"] += 1
                r["governance"]["audit_trail"]["last_updated"] = datetime.now().isoformat()
                r["governance"]["evidence_coverage_score"] = self._calculate_coverage(r)
                
                updated_review = r
                break
        
        if updated_review:
            self._save_reviews(reviews)
        return updated_review

    def detect_contradictions(self) -> List[Dict]:
        """내러티브 간의 잠재적 모순 감지 (장세별 성과 결론 중심)"""
        reviews = self._load_reviews()
        contradictions = []
        
        # 장세별 성과 요약 추출 (임시: Summary/Findings 텍스트 스캔)
        regime_conclusions = {} # (regime, persona) -> List[review_id, sentiment]
        
        for r in reviews:
            text = (r.get("summary", "") + " ".join(r.get("key_findings", ""))).lower()
            
            # 매우 단순한 키워드 기반 감정 분석
            positive = ["good", "strong", "outperform", "success", "profitable"]
            negative = ["bad", "weak", "underperform", "fail", "overtrade", "loss"]
            
            regimes = ["trending", "volatile", "sideways"]
            for regime in regimes:
                if regime in text:
                    pos_count = sum(1 for w in positive if w in text)
                    neg_count = sum(1 for w in negative if w in text)
                    
                    sentiment = "positive" if pos_count > neg_count else "negative" if neg_count > pos_count else "neutral"
                    
                    if regime not in regime_conclusions:
                        regime_conclusions[regime] = []
                    
                    # 이전 리뷰와 상반된 결론이 있는지 체크
                    for prev in regime_conclusions[regime]:
                        if sentiment != "neutral" and prev["sentiment"] != "neutral" and sentiment != prev["sentiment"]:
                            contradictions.append({
                                "type": "regime_performance_contradiction",
                                "regime": regime,
                                "reviews": [prev["review_id"], r["review_id"]],
                                "issue": f"Contradictory conclusions for '{regime}' market regime."
                            })
                    
                    regime_conclusions[regime].append({
                        "review_id": r["review_id"],
                        "sentiment": sentiment
                    })
                
        return contradictions

    def list_reviews(self) -> List[Dict]:
        return self._load_reviews()

    def generate_longitudinal_summary(self, session_ids: List[str], signals: List[Dict]) -> Dict:
        """여러 세션에 걸친 종단적 연구 요약 생성"""
        if not signals:
            return {"status": "no_data", "summary": "No evidence available for synthesis."}

        # 1. 페르소나별 성과 진화 추적
        persona_performance = {}
        for s in signals:
            pid = s.get("persona_id", "default")
            if pid not in persona_performance:
                persona_performance[pid] = {"total": 0, "wins": 0, "returns": []}
            
            persona_performance[pid]["total"] += 1
            if "outcomes" in s and "5m" in s["outcomes"]:
                ret = s["outcomes"]["5m"]["pct"]
                persona_performance[pid]["returns"].append(ret)
                if ret > 0: persona_performance[pid]["wins"] += 1

        # 2. 시장 상황(Regime) 적응력 분석
        regime_strengths = {}
        for s in signals:
            regime = s.get("market_regime", "unknown")
            if regime not in regime_strengths:
                regime_strengths[regime] = []
            if "outcomes" in s and "5m" in s["outcomes"]:
                regime_strengths[regime].append(s["outcomes"]["5m"]["pct"])

        # 3. 빈번한 실패 및 추론 패턴
        all_failures = []
        all_signatures = []
        for s in signals:
            all_failures.extend(s.get("evaluation", {}).get("flags", []))
            all_signatures.extend(s.get("evaluation", {}).get("reasoning_signature", []))

        top_failures = [f for f, _ in Counter(all_failures).most_common(3)]
        top_signatures = [sig for sig, _ in Counter(all_signatures).most_common(5)]

        # 4. 요약 내러티브 구성
        summary_text = f"Longitudinal study across {len(session_ids)} sessions and {len(signals)} decisions. "
        if top_signatures:
            summary_text += f"Dominant reasoning patterns: {', '.join(top_signatures)}. "
        if top_failures:
            summary_text += f"Recurring failure modes: {', '.join(top_failures)}."

        return {
            "summary": summary_text,
            "persona_stats": {pid: {"win_rate": round(d["wins"]/d["total"]*100, 2) if d["total"] > 0 else 0, 
                                   "avg_return": round(sum(d["returns"])/len(d["returns"]), 4) if d["returns"] else 0} 
                             for pid, d in persona_performance.items()},
            "regime_analysis": {r: round(sum(rets)/len(rets), 4) if rets else 0 for r, rets in regime_strengths.items()},
            "frequent_failures": top_failures,
            "session_count": len(session_ids),
            "signal_count": len(signals),
            "generated_at": datetime.now().isoformat()
        }
