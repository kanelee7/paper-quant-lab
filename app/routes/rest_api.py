from fastapi import APIRouter, HTTPException
from typing import Dict, Optional
import os

from exchange import MarketProvider, AssetType
from trader import AutoTrader

router = APIRouter()

# 전역 상태 관리
market_provider: Optional[MarketProvider] = None
auto_trader: Optional[AutoTrader] = None

@router.post("/select-exchange")
async def select_exchange(exchange_name: str, api_key: str, secret: str):
    global market_provider, auto_trader
    
    if exchange_name not in ["binance", "digifinex", "weex"]:
        raise HTTPException(status_code=400, detail="지원하지 않는 거래소입니다.")
    
    try:
        market_provider = MarketProvider(exchange_name, AssetType.CRYPTO, api_key, secret)
        auto_trader = AutoTrader(market_provider)
        return {"status": "success", "message": f"{exchange_name} 거래소가 연결되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/balance")
async def get_balance():
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    try:
        balance = await market_provider.fetch_balance()
        return balance
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/manual-order")
async def create_manual_order(symbol: str, side: str, amount: float):
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    try:
        order = await market_provider.create_market_order(symbol, side, amount)
        return order
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/load-env-keys")
async def load_env_keys(exchange: str = "binance"):
    try:
        # .env 파일에서 API 키 로드
        api_key = os.getenv(f"{exchange.upper()}_API_KEY", "")
        secret_key = os.getenv(f"{exchange.upper()}_SECRET_KEY", "")
        
        if not api_key or not secret_key:
            return {"status": "error", "message": ".env 파일에서 API 키를 찾을 수 없습니다."}
        
        return {
            "status": "success", 
            "api_key": api_key, 
            "secret_key": secret_key,
            "message": ".env 파일에서 API 키를 불러왔습니다."
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/disconnect-exchange")
async def disconnect_exchange():
    try:
        # 거래소 연결 상태 초기화
        global market_provider
        market_provider = None
        
        return {
            "status": "success",
            "message": "거래소 연결이 해제되었습니다."
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@router.get("/paper/status")
async def get_paper_status():
    """가상 계좌 상태 조회"""
    if not market_provider:
        raise HTTPException(status_code=400, detail="거래소가 선택되지 않았습니다.")
    
    try:
        balance = await market_provider.fetch_balance()
        positions = await market_provider.fetch_positions()
        history = market_provider.market.trades
        
        unrealized_pnl = sum(p['unrealizedPnl'] for p in positions)
        
        return {
            "virtual_balance": balance,
            "open_positions": positions,
            "trade_history": history,
            "unrealized_pnl": unrealized_pnl,
            "mode": "PAPER_TRADING_ONLY"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test-connection")
async def test_connection(exchange_name: str, api_key: str, secret: str):
    if exchange_name not in ["binance", "digifinex", "weex"]:
        raise HTTPException(status_code=400, detail="지원하지 않는 거래소입니다.")
    
    try:
        # 임시 MarketProvider 인스턴스 생성
        temp_provider = MarketProvider(exchange_name, AssetType.CRYPTO, api_key, secret)
        # 연결 테스트 (예: 잔고 조회)
        await temp_provider.fetch_balance()
        return {"status": "success", "message": "API 키가 유효합니다."}
    except Exception as e:
        return {"status": "error", "message": f"연결 테스트 실패: {str(e)}"}
