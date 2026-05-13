class AutoTrader:
    def __init__(self, exchange, symbol, strategy='price_change', test_mode=True):
        self.exchange = exchange
        self.symbol = symbol
        self.strategy = strategy
        self.test_mode = test_mode
        self.is_running = False

    def start(self):
        self.is_running = True
        print(f"자동 매매 시작: {self.symbol}, 전략: {self.strategy}, 테스트 모드: {self.test_mode}")

    def stop(self):
        self.is_running = False
        print("자동 매매 중지") 