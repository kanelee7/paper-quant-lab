from fastapi import WebSocket
import json
import asyncio
from typing import Dict, List
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.last_price = 0

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print("WebSocket 연결 수락됨")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print("WebSocket 연결 종료됨")

    async def broadcast(self, message: Dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                print(f"메시지 전송 실패: {e}")
                await self.disconnect(connection)

manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # 클라이언트로부터 메시지 수신 대기
            data = await websocket.receive_text()
            
            # 현재 시간을 타임스탬프로 변환
            current_time = int(datetime.now().timestamp() * 1000)
            
            # 임시 데이터 생성 (실제로는 거래소 API에서 받아와야 함)
            price = 50000 + (current_time % 1000)  # 임시 가격
            volume = 1.5  # 임시 거래량
            
            # 이전 가격 저장
            prev_price = manager.last_price
            manager.last_price = price
            
            # 데이터 포맷팅
            message = {
                "timestamp": current_time,
                "price": price,
                "volume": volume,
                "prev_price": prev_price
            }
            
            # 모든 연결된 클라이언트에게 데이터 전송
            await manager.broadcast(message)
            
            # 1초 대기
            await asyncio.sleep(1)
    except Exception as e:
        print(f"WebSocket 오류: {e}")
    finally:
        manager.disconnect(websocket) 