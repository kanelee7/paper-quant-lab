import React, { useEffect, useRef, useState } from 'react';
import { Box, Text, VStack, HStack, Select, Button, useToast, useColorMode, useColorModeValue, Center, Spinner } from '@chakra-ui/react';
// @ts-ignore
import { createChart, IChartApi, ISeriesApi, Time, ColorType, CrosshairMode } from 'lightweight-charts';
import styled from '@emotion/styled';
import { useWebSocket } from '../hooks/useWebSocket';

interface PriceData {
  timestamp: number;
  price: number;
  volume: number;
}

const ChartContainer = styled.div<{ isDarkMode: boolean }>`
  width: 100%;
  height: 600px;
  background-color: ${props => props.isDarkMode ? '#1E222D' : '#FFFFFF'};
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    height: 400px;
  }
`;

const ControlsContainer = styled.div<{ isDarkMode: boolean }>`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px;
  background-color: ${props => props.isDarkMode ? '#1E222D' : '#F5F5F5'};
  border-radius: 8px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const selectStyles = (isDarkMode: boolean) => ({
  bg: isDarkMode ? '#2A2E39' : '#FFFFFF',
  borderColor: isDarkMode ? '#363C4E' : '#E2E8F0',
  color: isDarkMode ? '#E2E8F0' : '#1A202C',
  _hover: {
    bg: isDarkMode ? '#363C4E' : '#EDF2F7',
  },
  sx: {
    '& option': {
      bg: isDarkMode ? '#2A2E39' : '#FFFFFF',
      color: isDarkMode ? '#E2E8F0' : '#1A202C',
    }
  }
});

interface PriceChartProps {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
}

const PriceChart: React.FC<PriceChartProps> = ({ symbol, onSymbolChange }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const { isConnected, lastMessage } = useWebSocket(symbol);
  const [timeframe, setTimeframe] = useState('1m');
  const [isAutoTrading, setIsAutoTrading] = useState(false);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { colorMode } = useColorMode();
  const isDarkMode = colorMode === 'dark';

  // 차트 초기화
  useEffect(() => {
    if (chartContainerRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: isDarkMode ? '#1A202C' : '#FFFFFF' },
          textColor: isDarkMode ? '#D9D9D9' : '#333333',
        },
        grid: {
          vertLines: { color: isDarkMode ? '#2D3748' : '#E2E8F0' },
          horzLines: { color: isDarkMode ? '#2D3748' : '#E2E8F0' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 600,
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
        },
        timeScale: {
          borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
          timeVisible: true,
          secondsVisible: true,
        },
      });

      candleSeriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderUpColor: '#26a69a',
        borderDownColor: '#ef5350',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      volumeSeriesRef.current = chartRef.current.addHistogramSeries({
        color: '#385263',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
      });

      const handleResize = () => {
        if (chartRef.current && chartContainerRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      // 차트 포커스 이벤트 리스너
      const handleFocusChart = (event: any) => {
        const { timestamp } = event.detail;
        if (chartRef.current) {
          chartRef.current.timeScale().scrollToPosition(0, true);
          // 실제로는 해당 시간대로 이동하는 로직이 더 정교해야 함
          chartRef.current.timeScale().setVisibleRange({
            from: (timestamp / 1000 - 3600) as Time,
            to: (timestamp / 1000 + 3600) as Time,
          });
        }
      };
      window.addEventListener('focus-chart', handleFocusChart);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('focus-chart', handleFocusChart);
        if (chartRef.current) {
          chartRef.current.remove();
        }
      };
    }
  }, [isDarkMode]);

  // 저널 데이터로 차트에 마커 표시
  useEffect(() => {
    const updateMarkers = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/journal');
        const journal = await response.json();
        
        if (candleSeriesRef.current && journal.length > 0) {
          const markers = journal.map((signal: any) => ({
            time: new Date(signal.timestamp).getTime() / 1000 as Time,
            position: signal.action === 'buy' ? 'belowBar' : 'aboveBar',
            color: signal.action === 'buy' ? '#26a69a' : '#ef5350',
            shape: signal.action === 'buy' ? 'arrowUp' : 'arrowDown',
            text: signal.action.toUpperCase(),
          }));
          candleSeriesRef.current.setMarkers(markers);
        }
      } catch (error) {
        console.error('Failed to fetch journal for markers:', error);
      }
    };

    if (candleSeriesRef.current) {
      updateMarkers();
      const interval = setInterval(updateMarkers, 10000);
      return () => clearInterval(interval);
    }
  }, [symbol]);

  // 초기 데이터 로딩
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log(`초기 데이터 로딩: ${symbol}, ${timeframe}`);
        const response = await fetch(`http://localhost:8000/ohlcv?symbol=${symbol}&timeframe=${timeframe}&limit=100`);
        const data = await response.json();
        console.log('초기 데이터:', data);
        
        if (candleSeriesRef.current && data && data.length > 0) {
          const candleData = data.map((item: any) => ({
            time: item.timestamp / 1000 as Time,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
          }));
          
          const volumeData = data.map((item: any) => ({
            time: item.timestamp / 1000 as Time,
            value: item.volume,
            color: item.close >= item.open ? '#26a69a' : '#ef5350',
          }));
          
          candleSeriesRef.current.setData(candleData);
          volumeSeriesRef.current?.setData(volumeData);
          
          // 데이터 저장
          setPriceData(data);
        } else {
          setError('No price data available');
        }
      } catch (error) {
        console.error('초기 데이터 로딩 실패:', error);
        setError('Failed to load price data');
        toast({
          title: '데이터 로딩 실패',
          description: '차트 데이터를 불러오는데 실패했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (chartRef.current) {
      fetchInitialData();
    }
  }, [symbol, timeframe, toast]);

  // 웹소켓 데이터 처리
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'price' && candleSeriesRef.current && volumeSeriesRef.current) {
      console.log('웹소켓 데이터 수신:', lastMessage);
      
      const { price, volume, timestamp } = lastMessage.data;
      const time = timestamp / 1000;
      
      // 마지막 캔들 데이터 가져오기
      const lastCandle = priceData.length > 0 ? priceData[priceData.length - 1] : null;
      
      if (lastCandle && Math.floor(lastCandle.timestamp / 1000) === Math.floor(time)) {
        // 같은 시간대의 캔들 업데이트
        const updatedCandle = {
          time: Math.floor(time) as Time,
          open: lastCandle.price,
          high: Math.max(lastCandle.price, price),
          low: Math.min(lastCandle.price, price),
          close: price,
        };
        
        const updatedVolume = {
          time: Math.floor(time) as Time,
          value: lastCandle.volume + volume,
          color: price >= lastCandle.price ? '#26a69a' : '#ef5350',
        };
        
        candleSeriesRef.current.update(updatedCandle);
        volumeSeriesRef.current.update(updatedVolume);
        
        // 데이터 업데이트
        const updatedData = [...priceData];
        updatedData[updatedData.length - 1] = {
          timestamp: Math.floor(time) * 1000,
          price,
          volume: lastCandle.volume + volume,
        };
        setPriceData(updatedData);
      } else {
        // 새로운 캔들 생성
        const newCandle = {
          time: Math.floor(time) as Time,
          open: price,
          high: price,
          low: price,
          close: price,
        };
        
        const newVolume = {
          time: Math.floor(time) as Time,
          value: volume,
          color: '#26a69a',
        };
        
        candleSeriesRef.current.update(newCandle);
        volumeSeriesRef.current.update(newVolume);
        
        // 데이터 추가
        setPriceData([...priceData, {
          timestamp: Math.floor(time) * 1000,
          price,
          volume,
        }]);
      }
    }
  }, [lastMessage, priceData]);

  const handleStartAutoTrading = async () => {
    try {
      const response = await fetch('http://localhost:8000/auto-trading/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          interval: parseInt(timeframe),
          strategy: 'price_change',
          test_mode: true,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setIsAutoTrading(true);
        toast({
          title: '자동 매매 시작',
          description: data.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('자동 매매 시작 오류:', error);
      toast({
        title: '자동 매매 시작 실패',
        description: '서버에 연결할 수 없습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleStopAutoTrading = async () => {
    try {
      const response = await fetch('http://localhost:8000/auto-trading/stop', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.status === 'success') {
        setIsAutoTrading(false);
        toast({
          title: '자동 매매 중지',
          description: data.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('자동 매매 중지 오류:', error);
      toast({
        title: '자동 매매 중지 실패',
        description: '서버에 연결할 수 없습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      bg={isDarkMode ? "gray.900" : "white"}
      borderRadius="md"
      p={4}
      height="600px"
      position="relative"
    >
      <ControlsContainer isDarkMode={isDarkMode}>
        <Select
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value)}
          variant="filled"
          bg={isDarkMode ? "gray.800" : "gray.100"}
          color={isDarkMode ? "gray.100" : "gray.800"}
          width="150px"
          size="sm"
          borderRadius="md"
          _hover={{ bg: isDarkMode ? "gray.700" : "gray.200" }}
          sx={{
            '& option': {
              bg: isDarkMode ? 'gray.800' : 'white',
              color: isDarkMode ? 'gray.100' : 'gray.800'
            }
          }}
        >
          <option value="BTC/USDT">BTC/USDT</option>
          <option value="ETH/USDT">ETH/USDT</option>
          <option value="XRP/USDT">XRP/USDT</option>
          <option value="LOKA/USDT">LOKA/USDT</option>
        </Select>
        <Select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          variant="filled"
          bg={isDarkMode ? "gray.800" : "gray.100"}
          color={isDarkMode ? "gray.100" : "gray.800"}
          width="100px"
          size="sm"
        >
          <option value="1m">1m</option>
          <option value="5m">5m</option>
          <option value="15m">15m</option>
          <option value="1h">1h</option>
          <option value="4h">4h</option>
          <option value="1d">1d</option>
        </Select>
        <Button
          size="sm"
          colorScheme={isAutoTrading ? 'red' : 'green'}
          onClick={isAutoTrading ? handleStopAutoTrading : handleStartAutoTrading}
        >
          {isAutoTrading ? '자동 매매 중지' : '자동 매매 시작'}
        </Button>
        <Text color={isConnected ? 'green.400' : 'red.400'}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
      </ControlsContainer>
      {isLoading ? (
        <Center h="500px">
          <Spinner size="xl" color={isDarkMode ? 'white' : 'gray.800'} />
        </Center>
      ) : error ? (
        <Center h="500px">
          <Text color="red.400">{error}</Text>
        </Center>
      ) : (
        <ChartContainer ref={chartContainerRef} isDarkMode={isDarkMode} />
      )}
    </Box>
  );
};

export default PriceChart; 