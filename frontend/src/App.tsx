import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  VStack,
  Text,
  Button,
  useToast,
  useColorMode,
  useColorModeValue,
  IconButton,
  Flex,
  Heading,
  Select,
  ChakraProvider,
  Input,
  HStack,
} from '@chakra-ui/react';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';
import OrderBook from './components/OrderBook';
import TradeHistory from './components/TradeHistory';
import TradingForm from './components/TradingForm';
import PriceChart from './components/PriceChart';
import ExchangeSettings from './components/ExchangeSettings';
import theme from './theme';
import RepeatTrading from './components/RepeatTrading';
import SignalJournal from './components/SignalJournal';
import PerformanceMetrics from './components/PerformanceMetrics';
import QuantInsights from './components/QuantInsights';

const App: React.FC = () => {
  const [settingsUpdated, setSettingsUpdated] = useState(0);
  const [isTrading, setIsTrading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState('binance');
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleSettingsUpdate = () => {
    setSettingsUpdated(prev => prev + 1);
  };

  const handleStartTrading = async () => {
    try {
      const response = await fetch('http://localhost:8000/auto-trading/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: selectedSymbol,
          strategy: 'price_change',
          interval: 60,
          test_mode: testMode,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setIsTrading(true);
        toast({
          title: '자동 매매 시작',
          description: data.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: '자동 매매 시작 실패',
          description: data.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: '자동 매매 시작 오류',
        description: '서버에 연결할 수 없습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleStopTrading = async () => {
    try {
      const response = await fetch('http://localhost:8000/auto-trading/stop', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.status === 'success') {
        setIsTrading(false);
        toast({
          title: '자동 매매 중지',
          description: data.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: '자동 매매 중지 실패',
          description: data.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: '자동 매매 중지 오류',
        description: '서버에 연결할 수 없습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleConnect = async () => {
    try {
      const response = await fetch('http://localhost:8000/select-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exchange: selectedExchange,
          api_key: apiKey,
          secret: secretKey,
          test_mode: testMode,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setIsConnected(true);
        setShowApiInput(false);
        toast({
          title: '거래소 연결 성공',
          description: data.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: '거래소 연결 실패',
          description: data.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: '거래소 연결 실패',
        description: '서버에 연결할 수 없습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('http://localhost:8000/disconnect', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.status === 'success') {
        setIsConnected(false);
        setApiKey('');
        setSecretKey('');
        toast({
          title: '거래소 연결 해제',
          description: data.message,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: '거래소 연결 해제 실패',
        description: '서버에 연결할 수 없습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleTestConnection = async () => {
    try {
      const response = await fetch('http://localhost:8000/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exchange: selectedExchange,
          api_key: apiKey,
          secret: secretKey,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast({
          title: 'API 연결 테스트 성공',
          description: data.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'API 연결 테스트 실패',
          description: data.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'API 연결 테스트 실패',
        description: '서버에 연결할 수 없습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleLoadEnvKeys = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/load-env-keys?exchange=${selectedExchange}`, {
        method: 'GET',
      });

      const data = await response.json();
      if (data.status === 'success') {
        setApiKey(data.api_key || '');
        setSecretKey(data.secret_key || '');
        toast({
          title: 'API 키 로드 성공',
          description: '.env 파일에서 API 키를 불러왔습니다.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'API 키 로드 실패',
          description: data.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'API 키 로드 실패',
        description: '서버에 연결할 수 없습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const toggleDeveloperMode = () => {
    setIsDeveloperMode(!isDeveloperMode);
  };

  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bg={bgColor}>
        <Container maxW="container.xl" py={4}>
          <VStack spacing={4} align="stretch">
            <Flex justifyContent="space-between" alignItems="center" mb={4}>
              <Heading size="lg">TRADING BOT</Heading>
              <HStack>
                <IconButton
                  aria-label="Toggle color mode"
                  icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                  onClick={toggleColorMode}
                />
                <Button
                  size="sm"
                  onClick={() => setIsDeveloperMode(!isDeveloperMode)}
                  colorScheme={isDeveloperMode ? 'blue' : 'gray'}
                >
                  {isDeveloperMode ? '개발자 모드 ON' : '개발자 모드 OFF'}
                </Button>
              </HStack>
            </Flex>

            <Grid
              templateColumns={{ base: "1fr", lg: "1fr 300px" }}
              gap={4}
            >
              <Box>
                <Grid
                  templateColumns={{ base: "1fr", xl: "1fr 300px" }}
                  gap={4}
                  mb={4}
                >
                  <Box
                    p={4}
                    borderRadius="lg"
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    height="600px"
                    overflow="hidden"
                  >
                    <Box h="100%" w="100%">
                      <PriceChart
                        symbol={selectedSymbol}
                        onSymbolChange={setSelectedSymbol}
                      />
                    </Box>
                  </Box>
                  <VStack spacing={4} maxH="600px">
                    <Box
                      p={4}
                      borderRadius="lg"
                      bg={cardBg}
                      borderWidth="1px"
                      borderColor={borderColor}
                      w="100%"
                      h="300px"
                      overflow="auto"
                      css={{
                        '&::-webkit-scrollbar': {
                          width: '4px',
                        },
                        '&::-webkit-scrollbar-track': {
                          width: '6px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: borderColor,
                          borderRadius: '24px',
                        },
                      }}
                    >
                      <OrderBook symbol={selectedSymbol} />
                    </Box>
                    <Box
                      p={4}
                      borderRadius="lg"
                      bg={cardBg}
                      borderWidth="1px"
                      borderColor={borderColor}
                      w="100%"
                      h="300px"
                      overflow="auto"
                      css={{
                        '&::-webkit-scrollbar': {
                          width: '4px',
                        },
                        '&::-webkit-scrollbar-track': {
                          width: '6px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: borderColor,
                          borderRadius: '24px',
                        },
                      }}
                    >
                      <TradeHistory trades={[]} />
                    </Box>
                  </VStack>
                </Grid>
                <Box
                  p={4}
                  borderRadius="lg"
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  mb={4}
                >
                  <TradingForm
                    isTrading={isTrading}
                    onStartTrading={handleStartTrading}
                    onStopTrading={handleStopTrading}
                    symbol={selectedSymbol}
                    onSymbolChange={setSelectedSymbol}
                  />
                </Box>
                <Box
                  p={4}
                  borderRadius="lg"
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <RepeatTrading isConnected={isConnected} />
                </Box>
              </Box>
              
              <Box>
                <VStack spacing={4} align="stretch">
                  <Box
                    p={4}
                    borderRadius="lg"
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <ExchangeSettings
                      selectedExchange={selectedExchange}
                      setSelectedExchange={setSelectedExchange}
                      apiKey={apiKey}
                      setApiKey={setApiKey}
                      secretKey={secretKey}
                      setSecretKey={setSecretKey}
                      showApiInput={showApiInput}
                      setShowApiInput={setShowApiInput}
                      isConnected={isConnected}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                      onTestConnection={handleTestConnection}
                      onLoadEnvKeys={handleLoadEnvKeys}
                      onSettingsUpdate={handleSettingsUpdate}
                      isDeveloperMode={isDeveloperMode}
                      testMode={testMode}
                      setTestMode={setTestMode}
                    />
                  </Box>
                  <PerformanceMetrics />
                  <QuantInsights />
                  <SignalJournal />
                </VStack>
              </Box>
            </Grid>
          </VStack>
        </Container>
      </Box>
    </ChakraProvider>
  );
};

export default App; 