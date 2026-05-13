import asyncio
import numpy as np
from typing import Dict, List, Optional, Tuple
import os
from datetime import datetime
import time
import random
import json

class AutoTrader:
    def __init__(self, market_provider, symbol="BTC/USDT", interval=10, strategy="price_change", test_mode=True):
        self.market = market_provider
        self.symbol = symbol
        self.asset_type = getattr(market_provider, 'asset_type', 'CRYPTO')
        self.interval = interval
        self.is_running = False
        self.position = None  # 'long', 'short', None
        self.entry_price = 0
        self.test_mode = test_mode
        
        # 전략 설정
        self.strategy = strategy  # 'price_change', 'rsi_ma', 'combined'
        
        # 매매 설정
        self.buy_threshold = -0.02  # 2% 하락시 매수
        self.sell_threshold = 0.02  # 2% 상승시 매도
        
        # 리스크 관리 설정
        self.stop_loss_percent = 0.03  # 3% 손절
        self.take_profit_percent = 0.05  # 5% 익절
        self.max_position_size = 1.0  # 최대 포지션 크기
        self.max_daily_loss = 0.1  # 일일 최대 손실 제한 (10%)
        self.trailing_stop = True  # 트레일링 스탑 사용
        self.trailing_stop_percent = 0.02  # 트레일링 스탑 거리 (2%)
        self.max_drawdown = 0.15  # 최대 드로다운 제한 (15%)
        
        # 거래 이력
        self.trade_history = []
        self.daily_pnl = 0
        self.peak_balance = 0
        
        # RSI 설정
        self.rsi_period = 14
        self.rsi_oversold = 30
        self.rsi_overbought = 70
        
        # 이동평균선 설정
        self.ma_period = 20
        self.ma_timeframe = '1m'
        
        # 기준가격 (최근 N개 종가의 평균)
        self.base_price = 0
        self.price_history = []
        self.price_history_size = 10
        
        # 기술적 지표 설정
        self.macd_fast = 12
        self.macd_slow = 26
        self.macd_signal = 9
        self.bb_period = 20
        self.bb_std = 2
        self.stoch_period = 14
        self.stoch_signal = 3
        self.atr_period = 14
        self.obv_period = 20
        self.last_price = None

    async def calculate_moving_average(self, timeframe: str = '1m', period: int = 20) -> float:
        """이동평균선 계산"""
        ohlcv = await self.market.fetch_ohlcv(self.symbol, timeframe, limit=period)
        if not ohlcv: return 0.0
        closes = [candle[4] for candle in ohlcv]  # 종가 데이터
        return sum(closes) / len(closes)

    async def calculate_rsi(self, timeframe: str = '1m', period: int = 14) -> float:
        """RSI 계산"""
        ohlcv = await self.market.fetch_ohlcv(self.symbol, timeframe, limit=period+1)
        if not ohlcv: return 50.0
        closes = [candle[4] for candle in ohlcv]  # 종가 데이터
        
        # 가격 변화 계산
        changes = [closes[i] - closes[i-1] for i in range(1, len(closes))]
        
        # 상승/하락 구분
        gains = [change if change > 0 else 0 for change in changes]
        losses = [-change if change < 0 else 0 for change in changes]
        
        # 평균 계산
        avg_gain = sum(gains) / period
        avg_loss = sum(losses) / period
        
        if avg_loss == 0:
            return 100
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return rsi

    async def update_base_price(self, current_price: float):
        """기준가격 업데이트"""
        self.price_history.append(current_price)
        if len(self.price_history) > self.price_history_size:
            self.price_history.pop(0)
        self.base_price = sum(self.price_history) / len(self.price_history)

    async def _create_signal(self, action: str, reason: str, price: float, indicators: Dict) -> Dict:
        """기록 및 전송을 위한 정형화된 시그널 객체 생성"""
        return {
            "timestamp": datetime.now().isoformat(),
            "symbol": self.symbol,
            "asset_type": self.asset_type,
            "action": action, # 'buy', 'sell', 'hold'
            "price": price,
            "strategy_name": self.strategy,
            "reason": reason,
            "indicators_snapshot": indicators,
            "confidence": 1.0 # 기본값
        }

    async def _log_to_journal(self, signal: Dict):
        """시그널을 로컬 JSON 파일에 기록 (Append-only)"""
        journal_path = "decision_journal.json"
        try:
            journal_data = []
            if os.path.exists(journal_path):
                with open(journal_path, "r", encoding="utf-8") as f:
                    try:
                        journal_data = json.load(f)
                    except json.JSONDecodeError:
                        journal_data = []
            
            journal_data.append(signal)
            
            # 최신 1000개만 유지 (파일 크기 관리)
            if len(journal_data) > 1000:
                journal_data = journal_data[-1000:]
                
            with open(journal_path, "w", encoding="utf-8") as f:
                json.dump(journal_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Journal logging error: {e}")

    async def check_price_change_strategy(self, current_price: float) -> Dict:
        """가격 변화 기반 전략 (Signal 객체 반환)"""
        await self.update_base_price(current_price)
        price_change = (current_price - self.base_price) / self.base_price if self.base_price > 0 else 0
        
        indicators = {"base_price": self.base_price, "price_change_pct": price_change * 100}
        
        if price_change <= self.buy_threshold:
            return await self._create_signal('buy', f"Price dropped {price_change*100:.2f}% below base", current_price, indicators)
        elif price_change >= self.sell_threshold:
            return await self._create_signal('sell', f"Price rose {price_change*100:.2f}% above base", current_price, indicators)
        
        return await self._create_signal('hold', "Price within threshold", current_price, indicators)

    async def check_rsi_ma_strategy(self, current_price: float) -> Dict:
        """RSI와 이동평균선 기반 전략 (Signal 객체 반환)"""
        ma = await self.calculate_moving_average(self.ma_timeframe, self.ma_period)
        rsi = await self.calculate_rsi(self.ma_timeframe, self.rsi_period)
        
        indicators = {"ma": ma, "rsi": rsi}
        
        if current_price > ma and rsi < self.rsi_oversold:
            return await self._create_signal('buy', f"Price > MA and RSI ({rsi:.2f}) < Oversold threshold", current_price, indicators)
        elif current_price < ma and rsi > self.rsi_overbought:
            return await self._create_signal('sell', f"Price < MA and RSI ({rsi:.2f}) > Overbought threshold", current_price, indicators)
        
        return await self._create_signal('hold', "No RSI/MA crossing", current_price, indicators)

    async def check_combined_strategy(self, current_price: float) -> Dict:
        """가격 변화 + RSI + 이동평균선 복합 전략 (Signal 객체 반환)"""
        price_sig = await self.check_price_change_strategy(current_price)
        rsi_ma_sig = await self.check_rsi_ma_strategy(current_price)
        
        indicators = {
            "price_change": price_sig['indicators_snapshot'],
            "rsi_ma": rsi_ma_sig['indicators_snapshot']
        }
        
        if price_sig['action'] == rsi_ma_sig['action'] and price_sig['action'] != 'hold':
            return await self._create_signal(price_sig['action'], "Both strategies aligned", current_price, indicators)
            
        return await self._create_signal('hold', "Strategies not aligned", current_price, indicators)

    async def check_entry_conditions(self) -> Optional[Dict]:
        """매수/매도 조건 확인 (Signal 객체 반환)"""
        try:
            ticker = await self.market.fetch_ticker(self.symbol)
            current_price = ticker['last']
            
            signal = None
            if self.strategy == "price_change":
                signal = await self.check_price_change_strategy(current_price)
            elif self.strategy == "rsi_ma":
                signal = await self.check_rsi_ma_strategy(current_price)
            elif self.strategy == "combined":
                signal = await self.check_combined_strategy(current_price)
            
            if signal:
                if signal['action'] != 'hold':
                    await self._log_to_journal(signal)
                return signal
                
            return None
                
        except Exception as e:
            print(f"진입 조건 확인 중 오류: {str(e)}")
            return None

    async def check_exit_conditions(self) -> Optional[Dict]:
        """청산 조건 확인 (Signal 객체 반환)"""
        if not self.position:
            return None
            
        try:
            ticker = await self.market.fetch_ticker(self.symbol)
            current_price = ticker['last']
            
            indicators = {"entry_price": self.entry_price, "current_price": current_price}
            
            # 손절 조건
            if self.position == 'long' and current_price < self.entry_price * (1 - self.stop_loss_percent):
                return await self._create_signal('sell', "Stop loss reached (Long)", current_price, indicators)
            elif self.position == 'short' and current_price > self.entry_price * (1 + self.stop_loss_percent):
                return await self._create_signal('buy', "Stop loss reached (Short)", current_price, indicators)
                
            # 익절 조건
            if self.position == 'long' and current_price > self.entry_price * (1 + self.take_profit_percent):
                return await self._create_signal('sell', "Take profit reached (Long)", current_price, indicators)
            elif self.position == 'short' and current_price < self.entry_price * (1 - self.take_profit_percent):
                return await self._create_signal('buy', "Take profit reached (Short)", current_price, indicators)
                
            return None
        except Exception as e:
            print(f"청산 조건 확인 중 오류: {str(e)}")
            return None

    async def execute_trade(self, side: str, amount: float = 0.001):
        """주문 실행 (시뮬레이션 전용)"""
        try:
            if amount > self.max_position_size:
                print(f"포지션 크기 제한 초과: {amount} > {self.max_position_size}")
                amount = self.max_position_size
            
            order = await self.market.create_market_order(self.symbol, side, amount)
            
            if side == 'buy':
                self.position = 'long'
            elif side == 'sell':
                self.position = 'short'
                
            ticker = await self.market.fetch_ticker(self.symbol)
            self.entry_price = ticker['last']
            
            trade = {
                "timestamp": datetime.now(),
                "side": side,
                "amount": amount,
                "price": self.entry_price,
                "symbol": self.symbol
            }
            self.trade_history.append(trade)
            
            print(f"[{datetime.now()}] [{self.asset_type} SIM] {side.upper()} 주문 실행: {amount} {self.symbol} @ {self.entry_price}")
            return order
        except Exception as e:
            print(f"주문 실행 중 오류: {str(e)}")
            return None

    async def close_position(self):
        """포지션 청산 (시뮬레이션 전용)"""
        if not self.position:
            return
            
        try:
            ticker = await self.market.fetch_ticker(self.symbol)
            current_price = ticker['last']
            
            pnl = (current_price - self.entry_price) / self.entry_price
            if self.position == 'short':
                pnl = -pnl
            
            self.daily_pnl += pnl
            if self.daily_pnl > self.peak_balance:
                self.peak_balance = self.daily_pnl
            
            side = 'sell' if self.position == 'long' else 'buy'
            order = await self.execute_trade(side, 0.001)
            
            if order:
                print(f"[{datetime.now()}] [{self.asset_type} SIM] 포지션 청산: {self.position} @ {self.entry_price} (손익: {pnl:.2%})")
                self.position = None
                self.entry_price = 0
                
            return order
        except Exception as e:
            print(f"포지션 청산 중 오류: {str(e)}")
            return None

    async def run(self):
        """자동 매매 연구 세션 실행"""
        self.is_running = True
        print(f"[{datetime.now()}] [{self.asset_type}] 연구 세션 시작: {self.symbol} (전략: {self.strategy})")
        
        while self.is_running:
            try:
                ticker = await self.market.fetch_ticker(self.symbol)
                current_price = ticker['last']
                
                if self.position:
                    exit_signal = await self.check_exit_conditions()
                    if exit_signal:
                        order = await self.close_position()
                        if order:
                            exit_signal['order_id'] = order.get('id')
                        await self._log_to_journal(exit_signal)
                else:
                    entry_signal = await self.check_entry_conditions()
                    if entry_signal and entry_signal['action'] != 'hold':
                        order = await self.execute_trade(entry_signal['action'])
                        if order:
                            entry_signal['order_id'] = order.get('id')
                            await self._log_to_journal(entry_signal)
                
                if hasattr(self, 'websocket') and self.websocket:
                    indicators = await self.get_technical_indicators()
                    data = {
                        "timestamp": ticker['timestamp'],
                        "price": current_price,
                        "volume": ticker.get('baseVolume', 0),
                        "indicators": indicators,
                        "last_signal": entry_signal if not self.position else exit_signal
                    }
                    await self.websocket.send_json(data)
                
                await asyncio.sleep(self.interval)
            except Exception as e:
                print(f"연구 세션 실행 중 오류: {str(e)}")
                await asyncio.sleep(self.interval)
                
    def stop(self):
        """연구 세션 중지"""
        self.is_running = False
        print(f"[{datetime.now()}] [{self.asset_type}] 연구 세션 중지")

    async def get_technical_indicators(self):
        """모든 기술적 지표 계산"""
        try:
            macd_line, signal_line, histogram = await self.calculate_macd()
            bb_middle, bb_upper, bb_lower = await self.calculate_bollinger_bands()
            stoch_k, stoch_d = await self.calculate_stochastic()
            atr = await self.calculate_atr()
            obv = await self.calculate_obv()
            
            return {
                'macd': {
                    'macd_line': macd_line,
                    'signal_line': signal_line,
                    'histogram': histogram
                },
                'bollinger_bands': {
                    'middle': bb_middle,
                    'upper': bb_upper,
                    'lower': bb_lower
                },
                'stochastic': {
                    'k_line': stoch_k,
                    'd_line': stoch_d
                },
                'atr': atr,
                'obv': obv
            }
        except Exception as e:
            print(f"기술적 지표 계산 중 오류: {str(e)}")
            return {}

    async def calculate_macd(self, timeframe: str = '1m') -> Tuple[List[float], List[float], List[float]]:
        """MACD 계산"""
        ohlcv = await self.market.fetch_ohlcv(self.symbol, timeframe, limit=100)
        if not ohlcv: return [], [], []
        closes = np.array([candle[4] for candle in ohlcv])
        
        ema_fast = np.array([closes[0]])
        ema_slow = np.array([closes[0]])
        alpha_fast = 2 / (self.macd_fast + 1)
        alpha_slow = 2 / (self.macd_slow + 1)
        
        for price in closes[1:]:
            ema_fast = np.append(ema_fast, price * alpha_fast + ema_fast[-1] * (1 - alpha_fast))
            ema_slow = np.append(ema_slow, price * alpha_slow + ema_slow[-1] * (1 - alpha_slow))
        
        macd_line = ema_fast - ema_slow
        signal_line = np.array([macd_line[0]])
        alpha_signal = 2 / (self.macd_signal + 1)
        for macd in macd_line[1:]:
            signal_line = np.append(signal_line, macd * alpha_signal + signal_line[-1] * (1 - alpha_signal))
        
        histogram = macd_line - signal_line
        return macd_line.tolist(), signal_line.tolist(), histogram.tolist()

    async def calculate_bollinger_bands(self, timeframe: str = '1m') -> Tuple[List[float], List[float], List[float]]:
        """볼린저 밴드 계산"""
        ohlcv = await self.market.fetch_ohlcv(self.symbol, timeframe, limit=self.bb_period)
        if not ohlcv: return [], [], []
        closes = np.array([candle[4] for candle in ohlcv])
        middle_band = np.array([np.mean(closes[i:i+self.bb_period]) for i in range(len(closes)-self.bb_period+1)])
        std = np.array([np.std(closes[i:i+self.bb_period]) for i in range(len(closes)-self.bb_period+1)])
        upper_band = middle_band + (std * self.bb_std)
        lower_band = middle_band - (std * self.bb_std)
        return middle_band.tolist(), upper_band.tolist(), lower_band.tolist()

    async def calculate_stochastic(self, timeframe: str = '1m') -> Tuple[List[float], List[float]]:
        """스토캐스틱 계산"""
        ohlcv = await self.market.fetch_ohlcv(self.symbol, timeframe, limit=self.stoch_period)
        if not ohlcv: return [], []
        highs = np.array([candle[2] for candle in ohlcv])
        lows = np.array([candle[3] for candle in ohlcv])
        closes = np.array([candle[4] for candle in ohlcv])
        lowest_low = np.array([np.min(lows[i:i+self.stoch_period]) for i in range(len(lows)-self.stoch_period+1)])
        highest_high = np.array([np.max(highs[i:i+self.stoch_period]) for i in range(len(highs)-self.stoch_period+1)])
        k = 100 * ((closes[self.stoch_period-1:] - lowest_low) / (highest_high - lowest_low + 1e-9))
        d = np.array([np.mean(k[i:i+self.stoch_signal]) for i in range(len(k)-self.stoch_signal+1)])
        return k.tolist(), d.tolist()

    async def calculate_atr(self, timeframe: str = '1m') -> List[float]:
        """ATR 계산"""
        ohlcv = await self.market.fetch_ohlcv(self.symbol, timeframe, limit=self.atr_period+1)
        if not ohlcv: return []
        highs = np.array([candle[2] for candle in ohlcv])
        lows = np.array([candle[3] for candle in ohlcv])
        closes = np.array([candle[4] for candle in ohlcv])
        tr1 = np.abs(highs[1:] - lows[1:])
        tr2 = np.abs(highs[1:] - closes[:-1])
        tr3 = np.abs(lows[1:] - closes[:-1])
        tr = np.maximum(np.maximum(tr1, tr2), tr3)
        atr = np.array([np.mean(tr[i:i+self.atr_period]) for i in range(len(tr)-self.atr_period+1)])
        return atr.tolist()

    async def calculate_obv(self, timeframe: str = '1m') -> List[float]:
        """OBV 계산"""
        ohlcv = await self.market.fetch_ohlcv(self.symbol, timeframe, limit=self.obv_period)
        if not ohlcv: return []
        closes = np.array([candle[4] for candle in ohlcv])
        volumes = np.array([candle[5] for candle in ohlcv])
        obv = np.array([volumes[0]])
        for i in range(1, len(closes)):
            if closes[i] > closes[i-1]:
                obv = np.append(obv, obv[-1] + volumes[i])
            elif closes[i] < closes[i-1]:
                obv = np.append(obv, obv[-1] - volumes[i])
            else:
                obv = np.append(obv, obv[-1])
        return obv.tolist()

class MultiCoinTrader:
    def __init__(self, market_provider, symbols=None, interval=1, strategy="price_change", test_mode=True):
        self.market = market_provider
        self.symbols = symbols or ["BTC/USDT", "ETH/USDT"]
        self.interval = interval
        self.strategy = strategy
        self.test_mode = test_mode
        self.is_running = False
        self.traders = {
            symbol: AutoTrader(market_provider, symbol, interval, strategy, test_mode) 
            for symbol in self.symbols
        }
        self.tasks = {}
        self.websocket_connections = set()

    async def monitor_symbol(self, symbol: str):
        trader = self.traders[symbol]
        try:
            while self.is_running:
                ticker = await self.market.fetch_ticker(symbol)
                current_price = ticker['last']
                signal = await trader.check_entry_conditions()
                if signal and signal['action'] != 'hold':
                    await trader.execute_trade(signal['action'])
                if trader.position and await trader.check_exit_conditions():
                    await trader.close_position()
                await asyncio.sleep(self.interval)
        except Exception as e:
            print(f"심볼 모니터링 오류 ({symbol}): {str(e)}")

    async def start(self):
        self.is_running = True
        for symbol in self.symbols:
            self.tasks[symbol] = asyncio.create_task(self.monitor_symbol(symbol))

    async def stop(self):
        self.is_running = False
        for task in self.tasks.values():
            task.cancel()
        self.tasks.clear()

class RepeatTrader:
    def __init__(self, market_provider, symbol="BTC/USDT", interval=60, amount=0.001, mode="buy_only", test_mode=True):
        self.market = market_provider
        self.symbol = symbol
        self.interval = interval
        self.amount = amount
        self.mode = mode
        self.is_running = False
        self.position = None
        self.trade_count = 0
        
    async def execute_trade(self, side: str):
        try:
            order = await self.market.create_market_order(self.symbol, side, self.amount)
            if side == 'buy':
                self.position = 'long'
            else:
                self.position = None
            self.trade_count += 1
            return order
        except Exception as e:
            print(f"반복 매매 실행 오류: {str(e)}")
            return None

    async def run(self):
        self.is_running = True
        while self.is_running:
            if self.mode == 'buy_only':
                await self.execute_trade('buy')
            elif self.mode == 'buy_sell':
                if not self.position:
                    await self.execute_trade('buy')
                else:
                    await self.execute_trade('sell')
            await asyncio.sleep(self.interval)
