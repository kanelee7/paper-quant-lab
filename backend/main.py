import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import ccxt
import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from exchange_manager import ExchangeManager
from auto_trader import AutoTrader
from fastapi import WebSocket
from fastapi.responses import JSONResponse

# .env 파일 로드
load_dotenv()

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 변수
exchange_manager = None
auto_trader = None

@app.post("/disconnect")
async def disconnect():
    try:
        if exchange_manager:
            exchange_manager.disconnect()
            return {"status": "success", "message": "거래소 연결이 해제되었습니다."}
        return {"status": "error", "message": "연결된 거래소가 없습니다."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/test-connection")
async def test_connection(exchange_data: dict):
    try:
        # 테스트용 거래소 인스턴스 생성
        exchange = getattr(ccxt, exchange_data["exchange"])({
            'apiKey': exchange_data["api_key"],
            'secret': exchange_data["secret"],
            'enableRateLimit': True,
        })
        
        # 거래소 연결 테스트
        exchange.fetch_balance()
        
        return {"status": "success", "message": "API 연결 테스트 성공"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/load-env-keys")
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