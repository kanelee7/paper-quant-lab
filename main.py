from fastapi import FastAPI, WebSocket, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
import os
from typing import Dict, Optional, List
from pydantic import BaseModel
import json
import ccxt
from dotenv import load_dotenv
import time
from datetime import datetime, timedelta

from trader import AutoTrader, MultiCoinTrader, RepeatTrader
from exchange import MarketProvider, AssetType
from backend.personas import PersonaManager
from persona_evaluator import PersonaEvaluator
from session_manager import SessionManager
from insight_manager import InsightManager
from reliability_manager import ReliabilityManager
from archive_manager import ArchiveManager
from workflow_manager import WorkflowManager
from pattern_manager import PatternManager
from replay_snapshot_manager import ReplaySnapshotManager
from backend.walkthrough_manager import WalkthroughManager

load_dotenv()

app = FastAPI(title="PaperQuantLab: Research Workstation")

# 전역 객체 초기화
persona_manager = PersonaManager()
persona_evaluator = PersonaEvaluator()
session_manager = SessionManager()
insight_manager = InsightManager()
reliability_manager = ReliabilityManager()
archive_manager = ArchiveManager()
review_manager = ReviewManager()
workflow_manager = WorkflowManager()
pattern_manager = PatternManager()
snapshot_manager = ReplaySnapshotManager()
walkthrough_manager = WalkthroughManager()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 운영 환경에서는 구체적인 origin으로 변경
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 상태 관리
market_provider: Optional[MarketProvider] = None
auto_trader: Optional[AutoTrader] = None
multi_trader: Optional[MultiCoinTrader] = None
auto_trading_task: Optional[asyncio.Task] = None
repeat_trader: Optional[RepeatTrader] = None
websocket_connections = set()

# 요청 모델
class ExchangeRequest(BaseModel):
    exchange_name: str
    api_key: str
    secret: str

class OrderRequest(BaseModel):
    symbol: str
    side: str
    amount: float
    price: Optional[float] = None

class AutoTradingRequest(BaseModel):
    symbol: Optional[str] = None
    interval: Optional[int] = None
    strategy: Optional[str] = "price_change"  # 'price_change', 'rsi_ma', 'combined'
    test_mode: Optional[bool] = True  # 기본값을 테스트 모드로 설정

class StopLossRequest(BaseModel):
    symbol: str
    side: str
    amount: float
    stop_price: float
    limit_price: Optional[float] = None

class TakeProfitRequest(BaseModel):
    symbol: str
    side: str
    amount: float
    take_profit_price: float
    limit_price: Optional[float] = None

class LeverageRequest(BaseModel):
    symbol: str
    leverage: int

class MultiTradingRequest(BaseModel):
    symbols: Optional[List[str]] = None
    interval: Optional[int] = 1
    strategy: Optional[str] = "price_change"
    test_mode: Optional[bool] = True

class RepeatTradingRequest(BaseModel):
    symbol: str = "BTC/USDT"
    interval: int = 60
    amount: float = 0.001
    mode: str = "buy_only"  # 'buy_only' or 'buy_sell'
    max_trades: Optional[int] = None
    test_mode: bool = True

class PersonaAnalysisRequest(BaseModel):
    symbol: str
    persona_ids: Optional[List[str]] = None

class SessionCreateRequest(BaseModel):
    title: str
    asset_type: str
    market: str
    personas: List[str]
    notes: Optional[str] = ""
    tags: Optional[List[str]] = []

class InsightCreateRequest(BaseModel):
    title: str
    summary: str
    linked_sessions: Optional[List[str]] = []
    linked_personas: Optional[List[str]] = []
    supporting_signals: Optional[List[str]] = []
    market_regimes: Optional[List[str]] = []
    failure_tags: Optional[List[str]] = []

@app.get("/api/reliability/status")
async def get_reliability_status():
    """연구 데이터 무결성 및 상태 보고서 조회"""
    return reliability_manager.validate_integrity()

@app.get("/api/reliability/reproducibility")
async def get_reproducibility_report():
    """재현성 및 리플레이 일관성 전용 진단 보고서 조회"""
    integrity = reliability_manager.validate_integrity()
    return {
        "status": integrity["status"],
        "schema_version": integrity["schema_version"],
        "replay_version": integrity["replay_version"],
        "broken_links": integrity["broken_links"],
        "recommendations": [
            "Ensure indicators_snapshot is present for all critical signals.",
            "Verify all bookmarked signals exist in the current journal.",
            "Update research environment metadata if migrating between machines."
        ]
    }

@app.post("/api/reliability/backup")
async def create_data_backup():
    """현재 연구 데이터의 수동 백업 생성"""
    backup_path = reliability_manager.create_backup()
    if backup_path:
        return {"status": "success", "backup_id": os.path.basename(backup_path)}
    raise HTTPException(status_code=500, detail="백업 생성 실패")

@app.get("/api/reliability/backups")
async def list_data_backups():
    """사용 가능한 모든 백업 목록 조회"""
    return reliability_manager.list_backups()

@app.post("/api/reliability/restore/{backup_id}")
async def restore_data_backup(backup_id: str):
    """특정 백업에서 데이터 복구"""
    success = reliability_manager.restore_backup(backup_id)
    if success:
        return {"status": "success", "message": "데이터 복구가 완료되었습니다. 애플리케이션 재시작을 권장합니다."}
    raise HTTPException(status_code=404, detail="백업을 찾을 수 없거나 복구에 실패했습니다.")

# 연구 주석 데이터 (Collaboration)
RESEARCH_COMMENTS_FILE = "research_comments.json"

def load_research_comments():
    if os.path.exists(RESEARCH_COMMENTS_FILE):
        try:
            with open(RESEARCH_COMMENTS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return []
    return []

def save_research_comments(comments):
    with open(RESEARCH_COMMENTS_FILE, "w", encoding="utf-8") as f:
        json.dump(comments, f, ensure_ascii=False, indent=2)

@app.get("/api/comments")
async def get_comments(signal_id: Optional[str] = Query(None)):
    comments = load_research_comments()
    if signal_id:
        comments = [c for c in comments if c.get("signal_id") == signal_id]
    return comments

@app.post("/api/comments")
async def add_comment(comment_data: Dict):
    import uuid
    from datetime import datetime
    comments = load_research_comments()
    new_comment = {
        "id": str(uuid.uuid4()),
        "author": comment_data.get("author", "Researcher"),
        "timestamp": datetime.now().isoformat(),
        "content": comment_data.get("content"),
        "signal_id": comment_data.get("signal_id"),
        "replay_context": comment_data.get("replay_context"),
    }
    comments.append(new_comment)
    save_research_comments(comments)
    return {"status": "success", "comment": new_comment}

@app.delete("/api/comments/{comment_id}")
async def delete_comment(comment_id: str):
    comments = load_research_comments()
    comments = [c for c in comments if c.get("id") != comment_id]
    save_research_comments(comments)
    return {"status": "success"}

# Research Archive Endpoints
@app.get("/api/archives")
async def list_archives():
    """모든 연구 아카이브 목록 조회"""
    return archive_manager.list_archives()

class ArchiveCreateRequest(BaseModel):
    title: str
    description: Optional[str] = ""

@app.post("/api/archives/create")
async def create_archive(request: ArchiveCreateRequest):
    """현재 연구 데이터의 스냅샷 아카이브 생성"""
    try:
        path = archive_manager.create_research_archive(request.title, request.description)
        return {"status": "success", "archive_id": os.path.basename(path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/archives/{archive_name}/validate")
async def validate_archive(archive_name: str):
    """특정 아카이브의 무결성 검증"""
    path = os.path.join(archive_manager.archive_root, archive_name)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="아카이브를 찾을 수 없습니다.")
    return archive_manager.validate_archive_integrity(path)

@app.post("/api/archives/{archive_name}/import")
async def import_archive(archive_name: str, mode: str = "merge"):
    """아카이브 데이터를 현재 환경으로 수입 (merge 또는 overwrite)"""
    path = os.path.join(archive_manager.archive_root, archive_name)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="아카이브를 찾을 수 없습니다.")
    
    success = archive_manager.import_archive(path, mode)
    if success:
        return {"status": "success", "message": f"아카이브 수입 완료 (모드: {mode})"}
    raise HTTPException(status_code=400, detail="아카이브 수입 실패")

# Research Review & Longitudinal Synthesis Endpoints
@app.get("/api/reviews")
async def list_reviews():
    """모든 연구 회고(Review) 목록 조회"""
    return review_manager.list_reviews()

@app.get("/api/reviews/{review_id}/governance")
async def get_review_governance(review_id: str):
    """특정 회고 내러티브의 거버넌스 및 신뢰도 보고서 조회"""
    return review_manager.validate_review_reliability(review_id)

@app.get("/api/reviews/contradictions")
async def get_review_contradictions():
    """연구 내러티브 간의 모순 보고서 조회"""
    return review_manager.detect_contradictions()

class ReviewCreateRequest(BaseModel):
    title: str
    summary: str
    linked_sessions: Optional[List[str]] = []
    linked_insights: Optional[List[str]] = []
    key_findings: Optional[List[str]] = []
    failure_patterns: Optional[List[str]] = []
    scope: Optional[str] = "multi-session"

@app.post("/api/reviews")
async def create_review(request: ReviewCreateRequest):
    """새로운 연구 회고 내러티브 생성"""
    return review_manager.create_review(
        title=request.title,
        summary=request.summary,
        linked_sessions=request.linked_sessions,
        linked_insights=request.linked_insights,
        key_findings=request.key_findings,
        failure_patterns=request.failure_patterns,
        scope=request.scope
    )

@app.put("/api/reviews/{review_id}")
async def update_review(review_id: str, request: ReviewCreateRequest):
    """기존 연구 회고 내러티브 업데이트"""
    updated = review_manager.update_review(review_id, request.dict())
    if updated:
        return updated
    raise HTTPException(status_code=404, detail="Review not found")

@app.get("/api/reviews/synthesis")
async def get_longitudinal_synthesis(session_ids: List[str] = Query(...)):
    """여러 세션을 가로지르는 종단적 연구 합성 데이터 조회"""
    journal_path = "decision_journal.json"
    signals = []
    if os.path.exists(journal_path):
        with open(journal_path, "r", encoding="utf-8") as f:
            journal_data = json.load(f)
            signals = [s for s in journal_data if s.get("session_id") in session_ids]
    
    return review_manager.generate_longitudinal_summary(session_ids, signals)

@app.get("/api/insights")
async def list_insights():
    return insight_manager.list_insights()

@app.post("/api/insights")
async def create_insight(request: InsightCreateRequest):
    return insight_manager.create_insight(
        title=request.title,
        summary=request.summary,
        linked_sessions=request.linked_sessions,
        linked_personas=request.linked_personas,
        supporting_signals=request.supporting_signals,
        market_regimes=request.market_regimes,
        failure_tags=request.failure_tags
    )

@app.get("/api/taxonomy/failures")
async def get_failure_taxonomy():
    return insight_manager.get_failure_taxonomy()

# Research Pattern Library Endpoints
@app.get("/api/patterns")
async def list_patterns():
    """모든 연구 패턴 아키타입 목록 조회"""
    return pattern_manager.list_patterns()

@app.post("/api/patterns")
async def create_pattern(request: Dict):
    """새로운 연구 패턴 아키타입 생성"""
    return pattern_manager.create_pattern_archetype(
        title=request.get("title"),
        description=request.get("description"),
        linked_failure_types=request.get("linked_failure_types"),
        linked_replay_ids=request.get("linked_replay_ids"),
        linked_personas=request.get("linked_personas")
    )

@app.get("/api/patterns/presets")
async def get_pattern_presets():
    """정의된 핵심 분석 패턴 아키타입 라이브러리 조회"""
    return pattern_manager.get_pattern_library_presets()

@app.get("/api/patterns/comparative")
async def get_comparative_stats(ids: str, type: str = "persona"):
    """페르소나 또는 장세 간의 비교 연구 데이터 조회"""
    target_ids = ids.split(",")
    return pattern_manager.generate_comparative_stats(target_ids, type)

@app.get("/api/sessions/{session_id}/summary")
async def get_session_summary(session_id: str):
    # 해당 세션의 시그널 가져오기
    journal_path = "decision_journal.json"
    signals = []
    if os.path.exists(journal_path):
        with open(journal_path, "r", encoding="utf-8") as f:
            journal_data = json.load(f)
            signals = [s for s in journal_data if s.get("session_id") == session_id]
    
    return insight_manager.generate_session_summary(session_id, signals)

@app.get("/api/sessions")
async def list_sessions():
    return session_manager.list_sessions()

@app.post("/api/sessions/start")
async def start_session(request: SessionCreateRequest):
    session = session_manager.create_session(
        title=request.title,
        asset_type=request.asset_type,
        market=request.market,
        personas=request.personas,
        notes=request.notes,
        tags=request.tags
    )
    # 현재 활성 AutoTrader가 있다면 세션 ID 업데이트
    if auto_trader:
        auto_trader.session_id = session["session_id"]
    return session

@app.post("/api/sessions/stop")
async def stop_session():
    session = session_manager.stop_active_session()
    if auto_trader:
        auto_trader.session_id = None
    return session

@app.get("/api/sessions/active")
async def get_active_session():
    return session_manager.get_active_session()

@app.post("/api/journal/bookmark/{signal_id}")
async def bookmark_signal(signal_id: str):
    active = session_manager.get_active_session()
    if not active:
        raise HTTPException(status_code=400, detail="활성 세션이 없습니다.")
    success = session_manager.add_bookmark(active["session_id"], signal_id)
    return {"status": "success" if success else "already_bookmarked"}

@app.get("/api/personas")
async def get_personas():
    return persona_manager.list_personas()

@app.get("/api/personas/evaluation/{persona_id}")
async def get_persona_evaluation(persona_id: str):
    """페르소나의 일관성 및 성과 상관관계 리포트 조회"""
    try:
        report = persona_evaluator.generate_full_report(persona_id)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/personas/evolution/{persona_id}")
async def get_persona_evolution(persona_id: str):
    """페르소나의 버전별/시간별 추론 드리프트 및 성과 변화 조회"""
    try:
        report = persona_evaluator.generate_full_report(persona_id)
        journal = persona_evaluator._load_journal()
        persona_signals = [s for s in journal if s.get("persona_id") == persona_id]
        
        drift_history = []
        for s in persona_signals:
            drift_history.append({
                "timestamp": s.get("timestamp"),
                "version": s.get("prompt_version"),
                "drift": s.get("evaluation", {}).get("drift_score", 0),
                "quality": s.get("evaluation", {}).get("quality_score", 0)
            })
            
        report["drift_history"] = drift_history
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/journal/similar/{signal_id}")
async def get_similar_reasoning(signal_id: str, limit: int = 3):
    """특정 시그널과 유사한 과거 추론 사례 조회"""
    try:
        similar = persona_evaluator.find_similar_reasoning(signal_id, limit)
        return similar
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Replay Snapshot Endpoints
@app.get("/api/replays/snapshots")
async def list_snapshots():
    """모든 리플레이 스냅샷 목록 조회"""
    return snapshot_manager.list_snapshots()

class SnapshotCreateRequest(BaseModel):
    title: str
    symbol: str
    timestamp: str
    signal_ids: Optional[List[str]] = []
    notes: Optional[str] = ""

@app.post("/api/replays/snapshots")
async def create_snapshot(request: SnapshotCreateRequest):
    """현재 리플레이 상태의 스냅샷 생성"""
    return snapshot_manager.create_snapshot(
        title=request.title,
        symbol=request.symbol,
        timestamp=request.timestamp,
        signals=request.signal_ids,
        notes=request.notes
    )

@app.delete("/api/replays/snapshots/{snapshot_id}")
async def delete_snapshot(snapshot_id: str):
    """특정 리플레이 스냅샷 삭제"""
    success = snapshot_manager.delete_snapshot(snapshot_id)
    if success:
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Snapshot not found")

@app.post("/api/persona-analysis")
async def analyze_personas(request: PersonaAnalysisRequest):
    global market_provider
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 연결되지 않았습니다.")
    
    # 임시 AutoTrader 생성하여 분석 수행
    temp_trader = AutoTrader(market_provider=market_provider, symbol=request.symbol)
    
    personas_to_run = []
    if request.persona_ids:
        for pid in request.persona_ids:
            p = persona_manager.get_persona(pid)
            if p:
                personas_to_run.append(p.to_dict())
    else:
        # 페르소나 ID가 제공되지 않으면 전체 실행
        personas_to_run = persona_manager.list_personas()
        
    if not personas_to_run:
        raise HTTPException(status_code=400, detail="실행할 페르소나가 없습니다.")
        
    signals = await temp_trader.generate_persona_signals(personas_to_run)
    return {"status": "success", "signals": signals}

@app.get("/api/load-env-keys")
async def load_env_keys(exchange: str = "binance"):
    try:
        # Validate exchange parameter
        if exchange.lower() not in ["binance", "digifinex"]:
            return {"status": "error", "message": "지원하지 않는 거래소입니다. (binance 또는 digifinex만 지원)"}
            
        # .env 파일에서 API 키 로드
        api_key = os.getenv(f"{exchange.upper()}_API_KEY", "")
        secret_key = os.getenv(f"{exchange.upper()}_SECRET_KEY", "")
        
        if not api_key or not secret_key:
            return {"status": "error", "message": f"{exchange} .env 파일에서 API 키를 찾을 수 없습니다."}
        
        return {
            "status": "success", 
            "exchange": exchange.lower(),
            "api_key": api_key, 
            "secret_key": secret_key,
            "message": f"{exchange} API 키를 불러왔습니다."
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/select-market")
async def select_market(market_data: Dict):
    global market_provider, auto_trader
    try:
        provider_id = market_data.get("provider", "binance")
        asset_type = AssetType(market_data.get("asset_type", "CRYPTO"))
        
        # API 키는 여전히 시뮬레이션용 데이터 조회를 위해 사용될 수 있음
        api_key = market_data.get("api_key") or os.getenv(f"{provider_id.upper()}_API_KEY", "test")
        secret = market_data.get("secret") or os.getenv(f"{provider_id.upper()}_SECRET_KEY", "test")
        
        market_provider = MarketProvider(provider_id, asset_type, api_key, secret)
        
        auto_trader = AutoTrader(
            market_provider=market_provider,
            symbol=market_data.get("symbol", "BTC/USDT" if asset_type == AssetType.CRYPTO else "AAPL"),
            interval=market_data.get("interval", 10),
            strategy=market_data.get("strategy", "price_change")
        )
        
        return {"status": "success", "message": f"Connected to {provider_id} for {asset_type} research"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/select-exchange")
async def select_exchange(exchange_data: Dict):
    # 하위 호환성을 위해 유지하되 내부적으로 select_market 호출
    exchange_data["provider"] = exchange_data.get("exchange")
    exchange_data["asset_type"] = "CRYPTO"
    return await select_market(exchange_data)

@app.get("/api/journal")
async def get_decision_journal(limit: int = 100):
    """최근 생성된 전략 시그널 및 결정 이력 조회 (결정론적 정렬 포함)"""
    journal_path = "decision_journal.json"
    try:
        if not os.path.exists(journal_path):
            return []
            
        with open(journal_path, "r", encoding="utf-8") as f:
            try:
                journal_data = json.load(f)
                if not isinstance(journal_data, list):
                    return []
                
                # 결정론적 정렬: 타임스탬프 기준 (재현성 보장)
                # 동일한 타임스탬프가 있을 경우 ID로 2차 정렬
                journal_data.sort(key=lambda x: (x.get("timestamp", ""), x.get("id", "")))
                
                return journal_data[-limit:]
            except json.JSONDecodeError:
                return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/journal/clear")
async def clear_decision_journal():
    """연구 세션 초기화를 위한 결정 이력 삭제"""
    journal_path = "decision_journal.json"
    try:
        if os.path.exists(journal_path):
            os.remove(journal_path)
        return {"status": "success", "message": "결정 이력이 초기화되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/journal/annotate")
async def annotate_signal(update_data: Dict):
    """결정 이력에 메모 또는 태그 추가"""
    journal_path = "decision_journal.json"
    timestamp = update_data.get("timestamp")
    notes = update_data.get("notes")
    tags = update_data.get("tags", [])
    
    try:
        if not os.path.exists(journal_path):
            raise HTTPException(status_code=404, detail="Journal not found")
            
        with open(journal_path, "r", encoding="utf-8") as f:
            try:
                journal_data = json.load(f)
                if not isinstance(journal_data, list):
                    raise HTTPException(status_code=500, detail="Journal is not a list")
            except json.JSONDecodeError:
                raise HTTPException(status_code=500, detail="Journal is corrupted")
            
        found = False
        for signal in journal_data:
            if isinstance(signal, dict) and signal.get("timestamp") == timestamp:
                signal["notes"] = notes
                signal["tags"] = tags
                found = True
                break
        
        if not found:
            raise HTTPException(status_code=404, detail="Signal not found")
            
        with open(journal_path, "w", encoding="utf-8") as f:
            json.dump(journal_data, f, ensure_ascii=False, indent=2)
            
        return {"status": "success", "message": "Annotation saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Research Workflow Endpoints
@app.get("/api/workflows/presets")
async def list_workflow_presets():
    """모든 연구 워크플로우 프리셋 목록 조회"""
    return workflow_manager.list_presets()

@app.get("/api/workflows/presets/{preset_id}")
async def get_workflow_preset(preset_id: str):
    """특정 연구 워크플로우 프리셋 상세 조회"""
    preset = workflow_manager.get_preset(preset_id)
    if preset:
        return preset
    raise HTTPException(status_code=404, detail="Preset not found")

# Guided Replay Walkthrough Endpoints
@app.get("/api/walkthroughs")
async def list_walkthroughs():
    """모든 가이드 워크스루 목록 조회"""
    return walkthrough_manager.list_walkthroughs()

@app.get("/api/walkthroughs/presets")
async def get_walkthrough_presets():
    """기본 제공 가이드 워크스루 프리셋 조회"""
    return walkthrough_manager.get_walkthrough_presets()

@app.post("/api/walkthroughs")
async def create_walkthrough(request: Dict):
    """새로운 가이드 워크스루 생성"""
    return walkthrough_manager.create_walkthrough(
        title=request.get("title"),
        description=request.get("description"),
        steps=request.get("steps", [])
    )

@app.get("/api/walkthroughs/{walkthrough_id}")
async def get_walkthrough(walkthrough_id: str):
    """특정 가이드 워크스루 상세 조회"""
    w = walkthrough_manager.get_walkthrough(walkthrough_id)
    if w:
        return w
    raise HTTPException(status_code=404, detail="Walkthrough not found")

@app.delete("/api/walkthroughs/{walkthrough_id}")
async def delete_walkthrough(walkthrough_id: str):
    """특정 가이드 워크스루 삭제"""
    success = walkthrough_manager.delete_walkthrough(walkthrough_id)
    if success:
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Walkthrough not found")

# Guided Replay Walkthrough Endpoints
@app.get("/api/walkthroughs")
async def list_walkthroughs():
    """모든 가이드 워크스루 목록 조회"""
    return walkthrough_manager.list_walkthroughs()

@app.get("/api/walkthroughs/presets")
async def get_walkthrough_presets():
    """기본 제공 가이드 워크스루 프리셋 조회"""
    return walkthrough_manager.get_walkthrough_presets()

@app.post("/api/walkthroughs")
async def create_walkthrough(request: Dict):
    """새로운 가이드 워크스루 생성"""
    return walkthrough_manager.create_walkthrough(
        title=request.get("title"),
        description=request.get("description"),
        steps=request.get("steps", [])
    )

@app.get("/api/walkthroughs/{walkthrough_id}")
async def get_walkthrough(walkthrough_id: str):
    """특정 가이드 워크스루 상세 조회"""
    w = walkthrough_manager.get_walkthrough(walkthrough_id)
    if w:
        return w
    raise HTTPException(status_code=404, detail="Walkthrough not found")

@app.delete("/api/walkthroughs/{walkthrough_id}")
async def delete_walkthrough(walkthrough_id: str):
    """특정 가이드 워크스루 삭제"""
    success = walkthrough_manager.delete_walkthrough(walkthrough_id)
    if success:
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Walkthrough not found")

async def track_outcomes():
    """시그널 생성 후 일정 시간(5m, 15m, 1h, 1d)이 지났을 때의 성과를 추적하는 백그라운드 태스크"""
    journal_path = "decision_journal.json"
    intervals = {
        "5m": 5 * 60,
        "15m": 15 * 60,
        "1h": 60 * 60,
        "1d": 24 * 60 * 60
    }
    
    while True:
        try:
            if os.path.exists(journal_path):
                journal_data = []
                try:
                    with open(journal_path, "r", encoding="utf-8") as f:
                        journal_data = json.load(f)
                        if not isinstance(journal_data, list):
                            journal_data = []
                except (json.JSONDecodeError, Exception) as e:
                    print(f"Outcome tracking: Error reading journal: {e}")
                    await asyncio.sleep(60)
                    continue
                
                updated = False
                now = datetime.now()
                
                for signal in journal_data:
                    if not isinstance(signal, dict) or "action" not in signal or "timestamp" not in signal:
                        continue
                        
                    # 'hold' 액션은 일단 제외하거나 별도 처리 가능
                    if signal["action"] == "hold":
                        continue
                        
                    try:
                        sig_time = datetime.fromisoformat(signal["timestamp"])
                        elapsed = (now - sig_time).total_seconds()
                        
                        for label, seconds in intervals.items():
                            if elapsed >= seconds and label not in signal.get("outcomes", {}):
                                # 해당 시점의 가격 가져오기 (시뮬레이션이므로 현재가로 근사치 기록)
                                if market_provider:
                                    ticker = await market_provider.fetch_ticker(signal["symbol"])
                                    current_price = ticker["last"]
                                    entry_price = signal["price"]
                                    
                                    pct = ((current_price - entry_price) / entry_price) * 100
                                    if signal["action"] == "sell":
                                        pct = -pct
                                        
                                    if "outcomes" not in signal:
                                        signal["outcomes"] = {}
                                    
                                    signal["outcomes"][label] = {
                                        "pct": round(pct, 4),
                                        "price_delta": round(current_price - entry_price, 2),
                                        "observed_at": now.isoformat()
                                    }
                                    updated = True
                                    print(f"Outcome tracked for {signal['id']} at {label}: {pct}%")
                    except Exception as e:
                        print(f"Error tracking signal outcome: {e}")
                
                if updated:
                    try:
                        with open(journal_path, "w", encoding="utf-8") as f:
                            json.dump(journal_data, f, ensure_ascii=False, indent=2)
                    except Exception as e:
                        print(f"Error saving updated journal: {e}")
                        
        except Exception as e:
            print(f"Outcome tracking task error: {e}")
            
        await asyncio.sleep(60) # 1분마다 확인

@app.on_event("startup")
async def startup_event():
    # 데이터 무결성 초기 검사 및 누락 파일 복구
    report = reliability_manager.validate_integrity()
    print(f"Startup Reliability Report: {report['status']}")
    
    # 백그라운드 태스크 시작
    asyncio.create_task(track_outcomes())

@app.get("/api/strategy/stats")
async def get_strategy_stats(session_id: Optional[str] = None):
    """전략 및 페르소나별 상세 성과 및 Outcome 기반 통계 조회"""
    journal_path = "decision_journal.json"
    try:
        if not os.path.exists(journal_path):
            return {}
            
        with open(journal_path, "r", encoding="utf-8") as f:
            try:
                journal_data = json.load(f)
                if not isinstance(journal_data, list):
                    return {}
            except json.JSONDecodeError:
                return {}
            
        stats = {}
        for signal in journal_data:
            if not isinstance(signal, dict):
                continue
            
            # 세션 필터링
            if session_id and signal.get("session_id") != session_id:
                continue
                
            strat = signal.get("strategy_name", "unknown")
            persona = signal.get("persona_id", "default")
            
            # Key can be strategy or persona
            key = f"{persona} ({strat})"
            
            if key not in stats:
                stats[key] = {
                    "total": 0, 
                    "buy": 0, 
                    "sell": 0, 
                    "hold": 0,
                    "outcomes_count": 0,
                    "total_return_5m": 0,
                    "wins_5m": 0,
                    "losses_5m": 0,
                    "persona_id": persona,
                    "strategy_name": strat
                }
            
            s = stats[key]
            s["total"] += 1
            if signal.get("action") == "buy":
                s["buy"] += 1
            elif signal.get("action") == "sell":
                s["sell"] += 1
            elif signal.get("action") == "hold":
                s["hold"] += 1
                
            # Outcome 기반 통계 (5분 기준 샘플)
            if "outcomes" in signal and "5m" in signal["outcomes"]:
                ret = signal["outcomes"]["5m"]["pct"]
                s["total_return_5m"] += ret
                s["outcomes_count"] += 1
                if ret > 0: s["wins_5m"] += 1
                elif ret < 0: s["losses_5m"] += 1
        
        # 가공
        for key, data in stats.items():
            if data["outcomes_count"] > 0:
                data["avg_return_5m"] = round(data["total_return_5m"] / data["outcomes_count"], 4)
                data["win_rate_5m"] = round(data["wins_5m"] / data["outcomes_count"] * 100, 2)
            else:
                data["avg_return_5m"] = 0
                data["win_rate_5m"] = 0
                
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/performance")
async def get_performance_metrics():
    """페이퍼 트레이딩 성과 지표 계산"""
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    
    try:
        trades = market_provider.market.trades
        if not trades:
            return {
                "total_trades": 0,
                "win_rate": 0,
                "total_pnl": 0,
                "average_pnl": 0
            }
            
        # 간단한 성과 지표 계산 (Buy -> Sell 쌍 매칭은 생략하고 단순 합산)
        total_pnl = sum(p['unrealizedPnl'] for p in await market_provider.fetch_positions())
        # 실현 손익은 거래 내역에서 추정 (PaperExchange에 기록된 trades 기준)
        
        return {
            "total_trades": len(trades),
            "total_pnl": total_pnl,
            "mode": "PAPER_TRADING"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/paper/status")
async def get_paper_status():
    """가상 계좌 상태 조회: 잔고, 포지션, 거래 이력, PnL"""
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    
    try:
        balance = await market_provider.fetch_balance()
        positions = await market_provider.fetch_positions()
        history = market_provider.market.trades
        
        # 미실현 손익 계산
        unrealized_pnl = sum(p['unrealizedPnl'] for p in positions)
        
        return {
            "virtual_balance": balance,
            "open_positions": positions,
            "trade_history": history,
            "unrealized_pnl": unrealized_pnl,
            "mode": "PAPER_TRADING_ONLY",
            "risk_warning": "이 모드는 가상 거래 전용이며 실제 주문이 발생하지 않습니다."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/balance")
async def get_balance():
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    try:
        balance = await market_provider.fetch_balance()
        return balance
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/market-order")
async def create_market_order(request: OrderRequest):
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    try:
        order = await market_provider.create_market_order(request.symbol, request.side, request.amount)
        return order
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/limit-order")
async def create_limit_order(request: OrderRequest):
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    if not request.price:
        raise HTTPException(status_code=400, detail="지정가 주문에는 가격이 필요합니다.")
    try:
        # MarketProvider currently only has create_market_order, 
        # but for compatibility we might need to add create_limit_order or use create_market_order
        # For now, use create_market_order as a fallback or if implemented in MarketProvider
        if hasattr(market_provider, 'create_limit_order'):
            order = await market_provider.create_limit_order(request.symbol, request.side, request.amount, request.price)
        else:
            order = await market_provider.create_market_order(request.symbol, request.side, request.amount)
        return order
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ohlcv")
async def get_ohlcv(symbol: Optional[str] = None, timeframe: str = "1m", limit: int = 100):
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    try:
        ohlcv = await market_provider.fetch_ohlcv(symbol, timeframe, limit)
        return ohlcv
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/order-book")
async def get_order_book(symbol: Optional[str] = None, limit: int = 20):
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    try:
        if hasattr(market_provider, 'fetch_order_book'):
            order_book = await market_provider.fetch_order_book(symbol, limit)
            return order_book
        return {"bids": [], "asks": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trades")
async def get_trades(symbol: Optional[str] = None, limit: int = 50):
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    try:
        if hasattr(market_provider, 'fetch_trades'):
            trades = await market_provider.fetch_trades(symbol, limit)
            return trades
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auto-trading/start")
async def start_auto_trading(request: AutoTradingRequest):
    global auto_trading_task
    
    if not auto_trader:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    
    if auto_trading_task and not auto_trading_task.done():
        raise HTTPException(status_code=400, detail="자동 매매가 이미 실행 중입니다.")
    
    try:
        if request.symbol:
            auto_trader.symbol = request.symbol
        if request.interval:
            auto_trader.interval = request.interval
        if request.strategy:
            if request.strategy not in ["price_change", "rsi_ma", "combined"]:
                raise HTTPException(status_code=400, detail="지원하지 않는 전략입니다.")
            auto_trader.strategy = request.strategy
        if request.test_mode is not None:
            auto_trader.test_mode = request.test_mode
            
        auto_trading_task = asyncio.create_task(auto_trader.run())
        mode = "테스트" if auto_trader.test_mode else "실전"
        return {"status": "success", "message": f"자동 매매가 시작되었습니다. (전략: {auto_trader.strategy}, 모드: {mode})"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auto-trading/stop")
async def stop_auto_trading():
    global auto_trading_task
    
    if not auto_trader:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    
    if not auto_trading_task or auto_trading_task.done():
        raise HTTPException(status_code=400, detail="자동 매매가 실행 중이 아닙니다.")
    
    try:
        auto_trader.stop()
        await auto_trading_task
        return {"status": "success", "message": "자동 매매가 중지되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/multi-trading/start")
async def start_multi_trading(request: MultiTradingRequest):
    global multi_trader
    
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    
    try:
        if multi_trader and multi_trader.is_running:
            raise HTTPException(status_code=400, detail="멀티 코인 트레이딩이 이미 실행 중입니다.")
        
        multi_trader = MultiCoinTrader(
            market_provider=market_provider,
            symbols=request.symbols,
            interval=request.interval,
            strategy=request.strategy,
            test_mode=request.test_mode
        )
        
        await multi_trader.start()
        mode = "테스트" if request.test_mode else "실전"
        return {
            "status": "success",
            "message": f"멀티 코인 트레이딩이 시작되었습니다. (전략: {request.strategy}, 모드: {mode})",
            "symbols": multi_trader.symbols
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/multi-trading/stop")
async def stop_multi_trading():
    global multi_trader
    
    if not multi_trader:
        raise HTTPException(status_code=400, detail="멀티 코인 트레이딩이 실행되지 않았습니다.")
    
    try:
        await multi_trader.stop()
        return {"status": "success", "message": "멀티 코인 트레이딩이 중지되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/multi-trading/add-symbol/{symbol}")
async def add_trading_symbol(symbol: str):
    if not multi_trader:
        raise HTTPException(status_code=400, detail="멀티 코인 트레이딩이 실행되지 않았습니다.")
    
    try:
        await multi_trader.add_symbol(symbol)
        return {"status": "success", "message": f"심볼 {symbol}이(가) 추가되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/multi-trading/remove-symbol/{symbol}")
async def remove_trading_symbol(symbol: str):
    if not multi_trader:
        raise HTTPException(status_code=400, detail="멀티 코인 트레이딩이 실행되지 않았습니다.")
    
    try:
        await multi_trader.remove_symbol(symbol)
        return {"status": "success", "message": f"심볼 {symbol}이(가) 제거되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/multi-trading/positions")
async def get_all_trading_positions():
    if not multi_trader:
        raise HTTPException(status_code=400, detail="멀티 코인 트레이딩이 실행되지 않았습니다.")
    
    try:
        positions = await multi_trader.get_all_positions()
        return positions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    websocket_connections.add(websocket)
    print(f"WebSocket 연결 수락됨")
    
    try:
        if multi_trader:
            multi_trader.add_websocket(websocket)
        
        while True:
            if auto_trader and auto_trader.is_running:
                print(f"자동 매매 실행 중: {auto_trader.test_mode=}")
                
                if auto_trader.test_mode:
                    ticker = await market_provider.fetch_ticker(auto_trader.symbol)
                    data = {
                        "timestamp": ticker['timestamp'],
                        "price": ticker['last'],
                        "volume": ticker.get('baseVolume', 0),
                        "indicators": await auto_trader.get_technical_indicators()
                    }
                else:
                    ticker = await market_provider.fetch_ticker(auto_trader.symbol)
                    data = {
                        "timestamp": ticker['timestamp'],
                        "price": ticker['last'],
                        "volume": ticker.get('baseVolume', 0),
                        "indicators": await auto_trader.get_technical_indicators()
                    }
                
                await websocket.send_json(data)
            
            await asyncio.sleep(auto_trader.interval if auto_trader else 1)
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
    finally:
        websocket_connections.remove(websocket)
        if multi_trader:
            multi_trader.remove_websocket(websocket)
        print("WebSocket 연결 종료")

@app.post("/stop-loss")
async def create_stop_loss(request: StopLossRequest):
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    try:
        order = await market_provider.create_stop_loss_order(
            request.symbol,
            request.side,
            request.amount,
            request.stop_price,
            request.limit_price
        )
        return order
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/take-profit")
async def create_take_profit(request: TakeProfitRequest):
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    try:
        order = await market_provider.create_take_profit_order(
            request.symbol,
            request.side,
            request.amount,
            request.take_profit_price,
            request.limit_price
        )
        return order
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/leverage")
async def set_leverage(request: LeverageRequest):
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    try:
        result = await market_provider.set_leverage(request.symbol, request.leverage)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/funding-rate")
async def get_funding_rate(symbol: Optional[str] = None):
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    try:
        funding_rate = await market_provider.fetch_funding_rate(symbol)
        return funding_rate
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/order/{order_id}")
async def get_order_status(order_id: str, symbol: Optional[str] = None):
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    try:
        order = await market_provider.fetch_order_status(order_id, symbol)
        return order
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trading-fees")
async def get_trading_fees(symbol: Optional[str] = None):
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    try:
        fees = await market_provider.fetch_trading_fees(symbol)
        return fees
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/positions")
async def get_positions(symbol: Optional[str] = None):
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    try:
        positions = await market_provider.fetch_positions(symbol)
        return positions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/position-risk")
async def get_position_risk(symbol: Optional[str] = None):
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    try:
        risk = await market_provider.fetch_position_risk(symbol)
        return risk
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/repeat-trading/start")
async def start_repeat_trading(request: RepeatTradingRequest):
    global repeat_trader
    
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    
    try:
        if repeat_trader and repeat_trader.is_running:
            raise HTTPException(status_code=400, detail="반복 매매가 이미 실행 중입니다.")
        
        repeat_trader = RepeatTrader(
            market_provider=market_provider,
            symbol=request.symbol,
            interval=request.interval,
            amount=request.amount,
            mode=request.mode,
            test_mode=request.test_mode
        )
        
        if request.max_trades:
            repeat_trader.set_max_trades(request.max_trades)
        
        asyncio.create_task(repeat_trader.run())
        mode = "테스트" if request.test_mode else "실전"
        return {
            "status": "success",
            "message": f"반복 매매가 시작되었습니다. (모드: {request.mode}, {mode})",
            "settings": {
                "symbol": request.symbol,
                "interval": request.interval,
                "amount": request.amount,
                "mode": request.mode,
                "max_trades": request.max_trades
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/repeat-trading/stop")
async def stop_repeat_trading():
    global repeat_trader
    
    if not repeat_trader:
        raise HTTPException(status_code=400, detail="반복 매매가 실행되지 않았습니다.")
    
    try:
        repeat_trader.stop()
        return {"status": "success", "message": "반복 매매가 중지되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/repeat-trading/status")
async def get_repeat_trading_status():
    if not repeat_trader:
        return {
            "is_running": False,
            "trade_count": 0,
            "settings": None
        }
    
    return {
        "is_running": repeat_trader.is_running,
        "trade_count": repeat_trader.trade_count,
        "settings": {
            "symbol": repeat_trader.symbol,
            "interval": repeat_trader.interval,
            "amount": repeat_trader.amount,
            "mode": repeat_trader.mode,
            "max_trades": repeat_trader.max_trades
        }
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
