import asyncio
import json
import websockets
import logging
from typing import Dict, List, Callable, Any, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("BinanceMarketProvider")

class BinanceMarketProvider:
    """Binance Public WebSocket Market Data Provider"""
    
    BASE_URL = "wss://stream.binance.com:9443/ws"

    def __init__(self):
        self.connections: Dict[str, asyncio.Task] = {}
        self.subscribers: Dict[str, List[Callable]] = {
            "kline": [],
            "depth": [],
            "trade": []
        }
        self.running = False

    def subscribe(self, stream_type: str, callback: Callable):
        if stream_type in self.subscribers:
            self.subscribers[stream_type].append(callback)

    async def _handle_stream(self, symbol: str, stream_type: str, params: str):
        url = f"{self.BASE_URL}/{symbol.lower()}@{params}"
        logger.info(f"Connecting to Binance Stream: {url}")
        
        while self.running:
            try:
                async with websockets.connect(url) as ws:
                    logger.info(f"Connected to {symbol} {stream_type}")
                    while self.running:
                        message = await ws.recv()
                        data = json.loads(message)
                        
                        # Process based on stream type
                        processed_data = self._process_data(stream_type, data)
                        if processed_data:
                            for callback in self.subscribers[stream_type]:
                                if asyncio.iscoroutinefunction(callback):
                                    await callback(symbol, processed_data)
                                else:
                                    callback(symbol, processed_data)
            except Exception as e:
                logger.error(f"Error in Binance Stream {stream_type}: {e}")
                if self.running:
                    await asyncio.sleep(5) # Wait before reconnecting

    def _process_data(self, stream_type: str, data: Any) -> Optional[Dict]:
        if stream_type == "kline":
            k = data['k']
            return {
                "timestamp": k['t'],
                "open": float(k['o']),
                "high": float(k['h']),
                "low": float(k['l']),
                "close": float(k['c']),
                "volume": float(k['v']),
                "closed": k['x']
            }
        elif stream_type == "depth":
            return {
                "bids": [[float(p), float(q)] for p, q in data['bids']],
                "asks": [[float(p), float(q)] for p, q in data['asks']]
            }
        elif stream_type == "trade":
            return {
                "time": data['T'],
                "price": float(data['p']),
                "amount": float(data['q']),
                "side": "sell" if data['m'] else "buy" # m: true means buyer is market maker (sell order)
            }
        return None

    async def start_symbol_streams(self, symbol: str):
        symbol = symbol.replace("/", "").lower()
        if symbol in self.connections:
            return

        self.running = True
        
        # Start kline (1m), depth (20 levels), and trade streams
        tasks = [
            asyncio.create_task(self._handle_stream(symbol, "kline", "kline_1m")),
            asyncio.create_task(self._handle_stream(symbol, "depth", "depth20@100ms")),
            asyncio.create_task(self._handle_stream(symbol, "trade", "trade"))
        ]
        self.connections[symbol] = asyncio.gather(*tasks)

    async def stop_symbol_streams(self, symbol: str):
        symbol = symbol.replace("/", "").lower()
        if symbol in self.connections:
            # This is a bit simplified, ideally we'd cancel individual tasks
            self.connections[symbol].cancel()
            del self.connections[symbol]

    async def stop_all(self):
        self.running = False
        for symbol in list(self.connections.keys()):
            await self.stop_symbol_streams(symbol)
