import React, { useEffect, useRef, useState } from 'react';
import { Box, Text, VStack, HStack, Select, Button, useToast, useColorMode, useColorModeValue, Center, Spinner, Badge, Divider, Skeleton } from '@chakra-ui/react';
// @ts-ignore
import { createChart, IChartApi, ISeriesApi, Time, ColorType, CrosshairMode } from 'lightweight-charts';
import styled from '@emotion/styled';
import { useWebSocket } from '../hooks/useWebSocket';
import { demoFetch } from "../demo/demoFetch";

interface PriceData {
  timestamp: number;
  price: number;
  volume: number;
}

const ChartWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

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
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: isDarkMode ? '#718096' : '#333333',
          fontSize: 10,
          fontFamily: 'Inter',
        },
        grid: {
          vertLines: { color: isDarkMode ? '#1A202C' : '#E2E8F0' },
          horzLines: { color: isDarkMode ? '#1A202C' : '#E2E8F0' },
        },
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight || 520,
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: '#B8A35A', width: 1, style: 2 },
          horzLine: { color: '#B8A35A', width: 1, style: 2 },
        },
        rightPriceScale: {
          borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
          scaleMargins: { top: 0.1, bottom: 0.2 },
        },
        timeScale: {
          borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: true,
        handleScale: true,
      });

      candleSeriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#8F9A5B',
        downColor: '#A84A4A',
        borderUpColor: '#8F9A5B',
        borderDownColor: '#A84A4A',
        wickUpColor: '#8F9A5B',
        wickDownColor: '#A84A4A',
      });

      volumeSeriesRef.current = chartRef.current.addHistogramSeries({
        color: '#282B33',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });

      volumeSeriesRef.current.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      const handleResize = () => {
        if (chartRef.current && chartContainerRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      // 차트 포커스 이벤트 리스너
      const handleFocusChart = (event: any) => {
        const { timestamp } = event.detail;
        if (chartRef.current && timestamp) {
            const timeInSeconds = timestamp / 1000;
            
            // Focus and center the logic
            // Lightweight charts doesn't have a direct 'center at' but we can use setVisibleRange
            // We'll approximate by showing 50 candles before and after
            const candleWidthSeconds = (timeframe === '1m' ? 60 : timeframe === '5m' ? 300 : 900);
            chartRef.current.timeScale().setVisibleRange({
                from: (timeInSeconds - (candleWidthSeconds * 30)) as Time,
                to: (timeInSeconds + (candleWidthSeconds * 30)) as Time,
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
        const response = await demoFetch('http://localhost:8000/api/journal');
        const journal = await response.json();
        
        if (candleSeriesRef.current && journal.length > 0) {
          const markers = journal.map((signal: any) => ({
            time: new Date(signal.timestamp).getTime() / 1000 as Time,
            position: signal.action === 'buy' ? 'belowBar' : 'aboveBar',
            color: signal.action === 'buy' ? '#8F9A5B' : '#A84A4A',
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
      const interval = setInterval(updateMarkers, 15000);
      return () => clearInterval(interval);
    }
  }, [symbol]);

  // 초기 데이터 로딩
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await demoFetch(`http://localhost:8000/ohlcv?symbol=${symbol}&timeframe=${timeframe}&limit=150`);
        const data = await response.json();
        
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
            color: item.close >= item.open ? '#2D3748' : '#2D3748',
          }));
          
          candleSeriesRef.current.setData(candleData);
          volumeSeriesRef.current?.setData(volumeData);
          setPriceData(data);
        } else {
          // Idle state data placeholder (faded ghost candles)
          const now = Math.floor(Date.now() / 1000);
          const idleData = Array.from({ length: 100 }).map((_, i) => ({
            time: (now - (100 - i) * 60) as Time,
            open: 50000 + Math.random() * 100,
            high: 50150 + Math.random() * 100,
            low: 49850 + Math.random() * 100,
            close: 50000 + Math.random() * 100,
          }));
          candleSeriesRef.current?.setData(idleData);
          candleSeriesRef.current?.applyOptions({
            upColor: 'rgba(143, 154, 91, 0.1)',
            downColor: 'rgba(168, 74, 74, 0.1)',
            borderUpColor: 'rgba(143, 154, 91, 0.1)',
            borderDownColor: 'rgba(168, 74, 74, 0.1)',
            wickUpColor: 'rgba(143, 154, 91, 0.1)',
            wickDownColor: 'rgba(168, 74, 74, 0.1)',
          });
          setError('Idle State');
        }
      } catch (error) {
        setError('Connection Error');
      } finally {
        setIsLoading(false);
      }
    };

    if (chartRef.current) {
      fetchInitialData();
    }
  }, [symbol, timeframe]);

  // 웹소켓 실시간 업데이트 생략 (필요시 기존 로직 유지)

  return (
    <Box height="100%" display="flex" flexDirection="column">
      {/* High-Density Toolbar */}
      <HStack 
        px={4} 
        py={2} 
        bg="background.surface" 
        borderBottom="1px" 
        borderColor="ui.border" 
        justifyContent="space-between"
      >
        <HStack spacing={4}>
            <Select
                value={symbol}
                onChange={(e) => onSymbolChange(e.target.value)}
                variant="unstyled"
                fontSize="xs"
                fontWeight="bold"
                width="auto"
                cursor="pointer"
                color="brand.500"
            >
                <option value="BTC/USDT">BTC/USDT</option>
                <option value="ETH/USDT">ETH/USDT</option>
                <option value="XRP/USDT">XRP/USDT</option>
                <option value="LOKA/USDT">LOKA/USDT</option>
            </Select>
            <Divider orientation="vertical" h="12px" borderColor="ui.border" />
            <HStack spacing={1}>
                {['1m', '5m', '15m', '1h', '1d'].map(tf => (
                    <Button 
                        key={tf} 
                        size="2xs" 
                        variant={timeframe === tf ? 'solid' : 'ghost'} 
                        colorScheme={timeframe === tf ? 'brand' : 'gray'}
                        onClick={() => setTimeframe(tf)}
                        fontSize="9px"
                        minW="32px"
                    >
                        {tf}
                    </Button>
                ))}
            </HStack>
        </HStack>
        <HStack>
            <Badge colorScheme={isConnected ? 'green' : 'red'} variant="subtle" fontSize="8px">
                {isConnected ? 'LIVE FEED' : 'DISCONNECTED'}
            </Badge>
        </HStack>
      </HStack>

      <Box flex={1} position="relative" p={2}>
        {isLoading && (
            <Center position="absolute" top={0} left={0} w="100%" h="100%" zIndex={5} bg="background.surface">
                <VStack spacing={4}>
                    <Spinner size="sm" color="brand.500" thickness="2px" />
                    <Text fontSize="10px" color="ui.muted" letterSpacing="widest">INITIALIZING REPLAY CONTEXT</Text>
                </VStack>
            </Center>
        )}
        {!isConnected && !isLoading && (
            <Center position="absolute" top="10%" left="50%" transform="translateX(-50%)" zIndex={5} pointerEvents="none">
                <VStack spacing={1} bg="blackAlpha.700" p={4} borderRadius="sm" border="1px solid" borderColor="ui.border" backdropFilter="blur(4px)">
                    <Text fontSize="xs" fontWeight="800" color="brand.500" letterSpacing="widest">IDLE ANALYTICAL SURFACE</Text>
                    <Text fontSize="9px" color="ui.muted">INITIALIZE RESEARCH FEED TO POPULATE EVIDENCE</Text>
                </VStack>
            </Center>
        )}
        <ChartWrapper ref={chartContainerRef} />
      </Box>
    </Box>
  );
};

export default PriceChart;
