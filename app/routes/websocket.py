from fastapi import WebSocket
import json
import asyncio
from typing import Dict, List, Set
from datetime import datetime
from backend.binance_provider import BinanceMarketProvider

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[WebSocket, str] = {} # socket -> symbol
        self.binance_provider = BinanceMarketProvider()
        self.binance_provider.subscribe("kline", self.on_kline)
        self.binance_provider.subscribe("depth", self.on_depth)
        self.binance_provider.subscribe("trade", self.on_trade)
        self.initialized_symbols: Set[str] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[websocket] = "BTC/USDT" # Default symbol
        print("WebSocket 연결 수락됨")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            del self.active_connections[websocket]
        print("WebSocket 연결 종료됨")

    async def on_kline(self, symbol: str, data: Dict):
        await self.broadcast_to_symbol(symbol, {"type": "kline", "symbol": symbol, "data": data})

    async def on_depth(self, symbol: str, data: Dict):
        await self.broadcast_to_symbol(symbol, {"type": "orderbook", "symbol": symbol, "data": data})

    async def on_trade(self, symbol: str, data: Dict):
        await self.broadcast_to_symbol(symbol, {"type": "trade", "symbol": symbol, "data": data})

    async def broadcast_to_symbol(self, symbol: str, message: Dict):
        # Normalize symbol for comparison
        norm_symbol = symbol.replace("/", "").upper()
        
        for connection, conn_symbol in list(self.active_connections.items()):
            norm_conn_symbol = conn_symbol.replace("/", "").upper()
            if norm_conn_symbol == norm_symbol:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    print(f"메시지 전송 실패: {e}")
                    self.disconnect(connection)

    async def subscribe_symbol(self, websocket: WebSocket, symbol: str):
        self.active_connections[websocket] = symbol
        norm_symbol = symbol.replace("/", "").upper()
        if norm_symbol not in self.initialized_symbols:
            await self.binance_provider.start_symbol_streams(symbol)
            self.initialized_symbols.add(norm_symbol)

manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # 클라이언트로부터 메시지 수신 대기
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                if message.get("type") == "subscribe":
                    symbol = message.get("symbol", "BTC/USDT")
                    await manager.subscribe_symbol(websocket, symbol)
                elif message.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except json.JSONDecodeError:
                pass
    except Exception as e:
        print(f"WebSocket 오류: {e}")
    finally:
        manager.disconnect(websocket)
 