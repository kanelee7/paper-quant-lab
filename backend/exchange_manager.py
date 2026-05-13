import ccxt

class ExchangeManager:
    def __init__(self, exchange_id: str, api_key: str = None, secret: str = None, test_mode: bool = True):
        self.exchange_id = exchange_id
        self.api_key = api_key
        self.secret = secret
        self.test_mode = True # 항상 테스트 모드 강제
        self.exchange = None
        self.connect()

    def connect(self):
        try:
            # ccxt 거래소 인스턴스 생성
            exchange_class = getattr(ccxt, self.exchange_id)
            self.exchange = exchange_class({
                'apiKey': self.api_key,
                'secret': self.secret,
                'enableRateLimit': True,
                'options': {
                    'defaultType': 'future',
                    'test': True, # Sandbox 모드 강제 (지원되는 경우)
                }
            })
            # 가상 거래 강제를 위해 주문 메서드 무력화 (추가 안전 장치)
            def disabled_order(*args, **kwargs):
                raise Exception("실전 주문은 비활성화되었습니다. Paper Trading 모드만 지원합니다.")
            
            self.exchange.create_order = disabled_order
            self.exchange.create_market_order = disabled_order
            self.exchange.create_limit_order = disabled_order
            
            return True
        except Exception as e:
            print(f"거래소 연결 실패: {str(e)}")
            return False

    def disconnect(self):
        """거래소 연결을 해제합니다."""
        self.exchange = None
        self.api_key = None
        self.secret = None
        print("거래소 연결이 해제되었습니다.") 