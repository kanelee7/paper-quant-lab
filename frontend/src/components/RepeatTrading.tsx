import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  VStack,
  Text,
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
} from '@chakra-ui/react';

interface RepeatTradingProps {
  isConnected: boolean;
}

const RepeatTrading: React.FC<RepeatTradingProps> = ({ isConnected }) => {
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [interval, setInterval] = useState(60);
  const [amount, setAmount] = useState(0.001);
  const [mode, setMode] = useState('buy_only');
  const [maxTrades, setMaxTrades] = useState<number | null>(null);
  const [testMode, setTestMode] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [tradeCount, setTradeCount] = useState(0);
  const toast = useToast();

  useEffect(() => {
    let intervalId: number;

    const fetchStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/repeat-trading/status');
        const data = await response.json();
        setIsRunning(data.is_running);
        setTradeCount(data.trade_count);
        if (data.settings) {
          setSymbol(data.settings.symbol);
          setInterval(data.settings.interval);
          setAmount(data.settings.amount);
          setMode(data.settings.mode);
          setMaxTrades(data.settings.max_trades);
        }
      } catch (error) {
        console.error('상태 조회 실패:', error);
      }
    };

    fetchStatus();
    intervalId = window.setInterval(fetchStatus, 5000);

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  const handleStart = async () => {
    try {
      const response = await fetch('http://localhost:8000/repeat-trading/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          interval,
          amount,
          mode,
          max_trades: maxTrades,
          test_mode: testMode,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setIsRunning(true);
        toast({
          title: '반복 매매 시작',
          description: data.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: '반복 매매 시작 실패',
          description: data.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: '반복 매매 시작 오류',
        description: '서버에 연결할 수 없습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleStop = async () => {
    try {
      const response = await fetch('http://localhost:8000/repeat-trading/stop', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.status === 'success') {
        setIsRunning(false);
        toast({
          title: '반복 매매 중지',
          description: data.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: '반복 매매 중지 실패',
          description: data.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: '반복 매매 중지 오류',
        description: '서버에 연결할 수 없습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg">
      <VStack spacing={4} align="stretch">
        <Text fontSize="xl" fontWeight="bold">반복 매매 설정</Text>
        
        <StatGroup>
          <Stat>
            <StatLabel>상태</StatLabel>
            <StatNumber>
              <Badge colorScheme={isRunning ? 'green' : 'gray'}>
                {isRunning ? '실행 중' : '중지됨'}
              </Badge>
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel>거래 횟수</StatLabel>
            <StatNumber>{tradeCount}</StatNumber>
          </Stat>
        </StatGroup>

        <Divider />

        <FormControl>
          <FormLabel>거래 쌍</FormLabel>
          <Select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            isDisabled={isRunning}
          >
            <option value="BTC/USDT">BTC/USDT</option>
            <option value="ETH/USDT">ETH/USDT</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>매매 간격 (초)</FormLabel>
          <NumberInput
            value={interval}
            onChange={(_, value) => setInterval(value)}
            min={1}
            isDisabled={isRunning}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        <FormControl>
          <FormLabel>매매 수량</FormLabel>
          <NumberInput
            value={amount}
            onChange={(_, value) => setAmount(value)}
            min={0.001}
            step={0.001}
            precision={3}
            isDisabled={isRunning}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        <FormControl>
          <FormLabel>매매 모드</FormLabel>
          <Select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            isDisabled={isRunning}
          >
            <option value="buy_only">매수만</option>
            <option value="buy_sell">매수/매도 반복</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>최대 거래 횟수 (선택)</FormLabel>
          <NumberInput
            value={maxTrades ?? ''}
            onChange={(_, value) => setMaxTrades(value || null)}
            min={1}
            isDisabled={isRunning}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">
            테스트 모드
          </FormLabel>
          <Switch
            isChecked={testMode}
            onChange={(e) => setTestMode(e.target.checked)}
            isDisabled={isRunning}
          />
        </FormControl>

        {!testMode && (
          <Text fontSize="sm" color="red.500" fontWeight="bold">
            ⚠️ 실제 모드에서는 실제 자산으로 거래가 이루어집니다.
          </Text>
        )}

        <Button
          colorScheme={isRunning ? 'red' : 'green'}
          onClick={isRunning ? handleStop : handleStart}
          isDisabled={!isConnected}
        >
          {isRunning ? '중지' : '시작'}
        </Button>
      </VStack>
    </Box>
  );
};

export default RepeatTrading; 