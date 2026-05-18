import { useEffect, useRef, useState } from 'react';
import { isDemoModeActive } from '../demo/demoService';

interface WebSocketMessage {
  type: 'price' | 'orderbook';
  symbol: string;
  data: any;
}

export const useWebSocket = (symbol: string = 'BTC/USDT') => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const currentSymbol = useRef<string>(symbol);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const heartbeatDelay = 30000; // 30초

  useEffect(() => {
    currentSymbol.current = symbol;
  }, [symbol]);

  const startHeartbeat = () => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }
    heartbeatInterval.current = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, heartbeatDelay);
  };

  const stopHeartbeat = () => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  };

  useEffect(() => {
    // Demo Mode에서는 웹소켓 연결을 시도하지 않음
    if (isDemoModeActive()) {
      console.log('Demo Mode active: WebSocket disabled');
      setIsConnected(true); // 시뮬레이션된 연결 상태
      return;
    }

    const connectWebSocket = () => {
      console.log('웹소켓 연결 시도...', reconnectAttempts.current);

      // 기존 연결이 있으면 닫기
      if (ws.current) {
        ws.current.close();
      }

      // 새 연결 생성
      try {
        ws.current = new WebSocket('ws://localhost:8000/ws');

        ws.current.onopen = () => {
          console.log('웹소켓 연결 성공');
          setIsConnected(true);
          reconnectAttempts.current = 0;

          // 연결 후 심볼 정보 전송
          if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ 
              type: 'subscribe',
              symbol: currentSymbol.current 
            }));
          }

          // 하트비트 시작
          startHeartbeat();
        };

        ws.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('웹소켓 메시지 수신:', message);

            // ping/pong 메시지는 무시
            if (message.type === 'pong') {
              return;
            }

            // 메시지가 현재 구독 중인 심볼과 일치하는지 확인
            if (message.symbol === currentSymbol.current) {
              setLastMessage(message);
            }
          } catch (error) {
            console.error('웹소켓 메시지 파싱 오류:', error);
          }
        };

        ws.current.onclose = (event) => {
          console.log('웹소켓 연결 종료 - 재연결 시도', event.code, event.reason);
          setIsConnected(false);
          stopHeartbeat();

          // 재연결 시도 횟수 증가
          reconnectAttempts.current += 1;

          // 최대 재연결 시도 횟수를 초과하지 않았으면 재연결
          if (reconnectAttempts.current < maxReconnectAttempts) {
            if (reconnectTimeout.current) {
              clearTimeout(reconnectTimeout.current);
            }
            // 지수 백오프: 1초, 2초, 4초, 8초, 16초
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 16000);
            reconnectTimeout.current = setTimeout(connectWebSocket, delay);
          } else {
            console.error('최대 재연결 시도 횟수 초과');
          }
        };

        ws.current.onerror = (error) => {
          console.error('웹소켓 오류:', error);
          setIsConnected(false);
          stopHeartbeat();
        };
      } catch (e) {
        console.error('WebSocket connection failed:', e);
      }
    };

    connectWebSocket();

    // 컴포넌트 언마운트 시 정리
    return () => {
      stopHeartbeat();
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, []);

  // 심볼이 변경될 때마다 구독 업데이트
  useEffect(() => {
    if (isDemoModeActive()) return;

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ 
        type: 'subscribe',
        symbol: currentSymbol.current 
      }));
    }
  }, [symbol]);

  const sendMessage = (message: any) => {
    if (isDemoModeActive()) return;

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('웹소켓이 연결되어 있지 않습니다.');
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}; 
 