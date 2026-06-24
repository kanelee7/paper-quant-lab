import ccxt.async_support as ccxt
import os
from typing import Dict, Optional, List, Any
import asyncio
from datetime import datetime
import uuid
from enum import Enum

class AssetType(str, Enum):
    CRYPTO = "CRYPTO"
    STOCK = "STOCK"
    ETF = "ETF"
    COMMODITY = "COMMODITY"

class SimulatedMarket:
    """자산 종류에 관계없이 가상 잔고와 주문을 관리하는 범용 시뮬레이션 엔진"""
    def __init__(self, data_source: Optional[Any] = None, asset_type: AssetType = AssetType.CRYPTO):
        self.data_source = data_source
        self.asset_type = asset_type
        # 초기 가상 잔고
        self.balance = {
            'USD': {'free': 10000.0, 'used': 0.0, 'total': 10000.0},
            'USDT': {'free': 10000.0, 'used': 0.0, 'total': 10000.0}
        }
        self.orders = []
        self.trades = []
        self.positions = {} # identifier -> {amount, entry_price, asset_metadata}

    async def fetch_balance(self) -> Dict:
        res = {'total': {}, 'free': {}, 'used': {}}
        for asset, data in self.balance.items():
            res['total'][asset] = data['total']
            res['free'][asset] = data['free']
            res['used'][asset] = data['used']
        return res

    async def fetch_ticker(self, symbol: str) -> Dict:
        if self.data_source and hasattr(self.data_source, 'fetch_ticker'):
            return await self.data_source.fetch_ticker(symbol)
        # 기본 더미 데이터
        return {
            'symbol': symbol,
            'last': 50000.0,
            'timestamp': int(datetime.now().timestamp() * 1000),
            'datetime': datetime.now().isoformat(),
            'asset_type': self.asset_type
        }

    async def create_order(self, symbol: str, type: str, side: str, amount: float, price: Optional[float] = None, params: Dict = {}) -> Dict:
        ticker = await self.fetch_ticker(symbol)
        current_price = price if price else ticker['last']

        # 간단한 심볼 파싱 (Crypto: BTC/USDT, Stock: AAPL)
        quote = 'USDT' if self.asset_type == AssetType.CRYPTO else 'USD'
        base = symbol.split('/')[0] if '/' in symbol else symbol

        if side == 'buy':
            cost = amount * current_price
            if self.balance.get(quote, {}).get('free', 0) < cost:
                raise Exception(f"Insufficient balance: {quote}")

            self.balance[quote]['free'] -= cost
            self.balance[quote]['total'] -= cost

            if base not in self.balance:
                self.balance[base] = {'free': 0.0, 'used': 0.0, 'total': 0.0}
            self.balance[base]['free'] += amount
            self.balance[base]['total'] += amount

            # Position update
            pos = self.positions.get(symbol, {'amount': 0.0, 'entry_price': 0.0, 'asset_type': self.asset_type})
            new_amount = pos['amount'] + amount
            new_entry = ((pos['amount'] * pos['entry_price']) + (amount * current_price)) / new_amount
            self.positions[symbol] = {'amount': new_amount, 'entry_price': new_entry, 'asset_type': self.asset_type}

        elif side == 'sell':
            if self.balance.get(base, {}).get('free', 0) < amount:
                raise Exception(f"Insufficient balance: {base}")

            self.balance[base]['free'] -= amount
            self.balance[base]['total'] -= amount

            self.balance[quote]['free'] += amount * current_price
            self.balance[quote]['total'] += amount * current_price

            # Position update
            pos = self.positions.get(symbol, {'amount': 0.0, 'entry_price': 0.0})
            if pos['amount'] >= amount:
                pos['amount'] -= amount
                if pos['amount'] == 0:
                    del self.positions[symbol]

        order_id = str(uuid.uuid4())
        order = {
            'id': order_id,
            'symbol': symbol,
            'asset_type': self.asset_type,
            'type': type,
            'side': side,
            'amount': amount,
            'price': current_price,
            'status': 'closed',
            'timestamp': int(datetime.now().timestamp() * 1000),
            'datetime': datetime.now().isoformat(),
            'cost': amount * current_price
        }
        self.orders.append(order)
        self.trades.append(order)
        return order

    async def fetch_positions(self, symbols: Optional[List[str]] = None) -> List:
        res = []
        for symbol, data in self.positions.items():
            if symbols and symbol not in symbols:
                continue
            ticker = await self.fetch_ticker(symbol)
            current_price = ticker['last']
            unrealized_pnl = (current_price - data['entry_price']) * data['amount']
            res.append({
                'symbol': symbol,
                'asset_type': data['asset_type'],
                'entryPrice': data['entry_price'],
                'contracts': data['amount'],
                'unrealizedPnl': unrealized_pnl,
                'notional': data['amount'] * current_price,
                'side': 'long' if data['amount'] > 0 else 'short'
            })
        return res

class MarketProvider:
    """자산 유형별 데이터 소스를 추상화하고 시뮬레이션 시장을 연결하는 통합 프로바이더"""
    def __init__(self, provider_id: str, asset_type: AssetType = AssetType.CRYPTO, api_key: str = "test", secret: str = "test"):
        self.provider_id = provider_id
        self.asset_type = asset_type

        # 실제 데이터 소스 (현재는 Crypto용 CCXT만 지원, 추후 확장 가능)
        self.data_source = None
        if asset_type == AssetType.CRYPTO:
            try:
                exchange_class = getattr(ccxt, provider_id)
                config = {'enableRateLimit': True}
                if api_key and api_key != "test" and api_key.strip() != "":
                    config['apiKey'] = api_key
                if secret and secret != "test" and secret.strip() != "":
                    config['secret'] = secret
                self.data_source = exchange_class(config)
            except Exception as e:
                print(f"Warning: Could not initialize CCXT data source: {e}")

        # 모든 자산에 대해 시뮬레이션 시장 사용
        self.market = SimulatedMarket(self.data_source, asset_type)

    async def fetch_balance(self) -> Dict:
        return await self.market.fetch_balance()

    async def fetch_ticker(self, symbol: str) -> Dict:
        return await self.market.fetch_ticker(symbol)

    async def create_market_order(self, symbol: str, side: str, amount: float) -> Dict:
        print(f"[{self.asset_type}] Simulating Market Order: {side} {amount} {symbol}")
        return await self.market.create_order(symbol, 'market', side, amount)

    async def fetch_ohlcv(self, symbol: str, timeframe: str = '1m', limit: int = 100) -> List:
        if self.data_source and hasattr(self.data_source, 'fetch_ohlcv'):
            return await self.data_source.fetch_ohlcv(symbol, timeframe, limit=limit)
        return []

    async def fetch_positions(self, symbol: str = None) -> List:
        return await self.market.fetch_positions([symbol] if symbol else None)

    async def close(self):
        if self.data_source and hasattr(self.data_source, 'close'):
            await self.data_source.close()