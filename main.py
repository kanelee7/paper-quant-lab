from fastapi import FastAPI, WebSocket, HTTPException
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

from trader import AutoTrader, MultiCoinTrader, RepeatTrader
from exchange import MarketProvider, AssetType

load_dotenv()

app = FastAPI(title="PaperQuantLab: Research Workstation")

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
    """최근 생성된 전략 시그널 및 결정 이력 조회"""
    journal_path = "decision_journal.json"
    try:
        if not os.path.exists(journal_path):
            return []
            
        with open(journal_path, "r", encoding="utf-8") as f:
            try:
                journal_data = json.load(f)
                if not isinstance(journal_data, list):
                    journal_data = []
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
                with open(journal_path, "r", encoding="utf-8") as f:
                    try:
                        journal_data = json.load(f)
                        if not isinstance(journal_data, list):
                            journal_data = []
                    except json.JSONDecodeError:
                        journal_data = []
                
                updated = False
                now = datetime.now()
                
                for signal in journal_data:
                    if not isinstance(signal, dict) or "action" not in signal or "timestamp" not in signal:
                        continue
                        
                    # 'hold' 액션은 일단 제외하거나 별도 처리 가능
                    if signal["action"] == "hold":
                        continue
                        
                    sig_time = datetime.fromisoformat(signal["timestamp"])
                    elapsed = (now - sig_time).total_seconds()
                    
                    for label, seconds in intervals.items():
                        if elapsed >= seconds and label not in signal.get("outcomes", {}):
                            # 해당 시점의 가격 가져오기 (시뮬레이션이므로 현재가로 근사치 기록)
                            if market_provider:
                                try:
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
                                    print(f"Error fetching ticker for outcome: {e}")
                
                if updated:
                    with open(journal_path, "w", encoding="utf-8") as f:
                        json.dump(journal_data, f, ensure_ascii=False, indent=2)
                        
        except Exception as e:
            print(f"Outcome tracking task error: {e}")
            
        await asyncio.sleep(60) # 1분마다 확인

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(track_outcomes())

@app.get("/api/strategy/stats")
async def get_strategy_stats():
    """전략별 상세 성과 및 Outcome 기반 통계 조회"""
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
            if not isinstance(signal, dict) or "strategy_name" not in signal:
                continue
            strat = signal["strategy_name"]
            if strat not in stats:
                stats[strat] = {
                    "total": 0, 
                    "buy": 0, 
                    "sell": 0, 
                    "hold": 0,
                    "outcomes_count": 0,
                    "total_return_5m": 0,
                    "wins_5m": 0,
                    "losses_5m": 0
                }
            
            s = stats[strat]
            s["total"] += 1
            if signal["action"] == "buy":
                s["buy"] += 1
            elif signal["action"] == "sell":
                s["sell"] += 1
            elif signal["action"] == "hold":
                s["hold"] += 1
                
            # Outcome 기반 통계 (5분 기준 샘플)
            if "outcomes" in signal and "5m" in signal["outcomes"]:
                ret = signal["outcomes"]["5m"]["pct"]
                s["total_return_5m"] += ret
                s["outcomes_count"] += 1
                if ret > 0: s["wins_5m"] += 1
                elif ret < 0: s["losses_5m"] += 1
        
        # 가공
        for strat, data in stats.items():
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
