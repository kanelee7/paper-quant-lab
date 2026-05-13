from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from .routes import rest_api
from .routes.websocket import websocket_endpoint

app = FastAPI(title="Trading Bot API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 운영 환경에서는 구체적인 origin으로 변경
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(rest_api.router, prefix="/api", tags=["rest"])

# WebSocket 엔드포인트 등록
app.add_api_websocket_route("/ws", websocket_endpoint)

@app.get("/")
async def root():
    return {"message": "Auto Trading Bot API"}

@app.get("/load-env-keys")
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

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 