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
  HStack,
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
        console.error('Status fetch failed:', error);
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
          title: 'Recursive Run Started',
          description: data.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Run Failed to Start',
          description: data.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Network Error',
        description: 'Failed to communicate with recursive runner.',
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
          title: 'Recursive Run Terminated',
          description: data.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Termination Failed',
          description: data.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Network Error',
        description: 'Failed to stop recursive runner.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="blackAlpha.300">
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
            <Text fontSize="xs" fontWeight="bold" color="gray.400">RECURSIVE RUN SETTINGS</Text>
            <Badge colorScheme="purple" variant="outline" fontSize="9px">STRESS TEST</Badge>
        </HStack>
        
        <StatGroup bg="blackAlpha.200" p={2} borderRadius="md">
          <Stat>
            <StatLabel fontSize="10px">RUN STATUS</StatLabel>
            <StatNumber fontSize="sm">
              <Badge colorScheme={isRunning ? 'green' : 'gray'}>
                {isRunning ? 'ACTIVE' : 'IDLE'}
              </Badge>
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel fontSize="10px">EXECUTION COUNT</StatLabel>
            <StatNumber fontSize="sm">{tradeCount}</StatNumber>
          </Stat>
        </StatGroup>

        <Divider borderColor="ui.border" />

        <FormControl>
          <FormLabel fontSize="10px">TARGET SYMBOL</FormLabel>
          <Select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            isDisabled={isRunning}
            size="sm"
            bg="background.deep"
          >
            <option value="BTC/USDT">BTC/USDT</option>
            <option value="ETH/USDT">ETH/USDT</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="10px">RUN INTERVAL (SEC)</FormLabel>
          <NumberInput
            value={interval}
            onChange={(_, value) => setInterval(value)}
            min={1}
            isDisabled={isRunning}
            size="sm"
          >
            <NumberInputField bg="background.deep" />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="10px">RUN VOLUME</FormLabel>
          <NumberInput
            value={amount}
            onChange={(_, value) => setAmount(value)}
            min={0.001}
            step={0.001}
            precision={3}
            isDisabled={isRunning}
            size="sm"
          >
            <NumberInputField bg="background.deep" />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="10px">RUN MODE</FormLabel>
          <Select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            isDisabled={isRunning}
            size="sm"
            bg="background.deep"
          >
            <option value="buy_only">Initialize Only</option>
            <option value="buy_sell">Initialize & Terminate Loop</option>
          </Select>
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0" fontSize="10px">
            SIMULATION MODE
          </FormLabel>
          <Switch
            isChecked={testMode}
            onChange={(e) => setTestMode(e.target.checked)}
            isDisabled={isRunning}
            size="sm"
          />
        </FormControl>

        <Button
          colorScheme={isRunning ? 'red' : 'brand'}
          variant={isRunning ? 'solid' : 'outline'}
          onClick={isRunning ? handleStop : handleStart}
          isDisabled={!isConnected}
          size="sm"
          fontSize="xs"
          letterSpacing="widest"
        >
          {isRunning ? 'STOP RUN' : 'START RECURSIVE RUN'}
        </Button>
      </VStack>
    </Box>
  );
};

export default RepeatTrading;
