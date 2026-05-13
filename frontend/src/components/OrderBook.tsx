import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  VStack,
  HStack,
  Progress,
  useColorMode,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { useWebSocket } from '../hooks/useWebSocket';

interface OrderBookProps {
  symbol: string;
}

interface OrderBookData {
  bids: [number, number][];
  asks: [number, number][];
}

interface WebSocketOrderBookMessage {
  orderbook: OrderBookData;
}

const OrderBook: React.FC<OrderBookProps> = ({ symbol }) => {
  const [orderBook, setOrderBook] = useState<OrderBookData>({ bids: [], asks: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, lastMessage } = useWebSocket(symbol);
  const { colorMode } = useColorMode();
  const isDarkMode = colorMode === 'dark';

  useEffect(() => {
    const fetchOrderBook = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`http://localhost:8000/orderbook?symbol=${symbol}`);
        const data = await response.json();
        if (data.status === 'success') {
          setOrderBook(data.data as OrderBookData);
        } else {
          setError('Failed to load order book data');
        }
      } catch (error) {
        console.error('Failed to fetch order book:', error);
        setError('Failed to connect to server');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 5000);
    return () => clearInterval(interval);
  }, [symbol]);

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'orderbook') {
      setOrderBook(lastMessage.data);
      setIsLoading(false);
      setError(null);
    }
  }, [lastMessage]);

  const getMaxVolume = (orders: [number, number][]) => {
    return Math.max(...orders.map(([_, volume]) => volume));
  };

  const maxBidVolume = getMaxVolume(orderBook.bids);
  const maxAskVolume = getMaxVolume(orderBook.asks);

  const renderOrders = (orders: [number, number][], isBids: boolean) => {
    const sortedOrders = [...orders].sort((a, b) => 
      isBids ? b[0] - a[0] : a[0] - b[0]
    ).slice(0, 15);

    return sortedOrders.map(([orderPrice, orderVolume], index) => (
      <Tr key={index}>
        <Td>
          <HStack spacing={2}>
            <Text color={isBids ? 'green.400' : 'red.400'}>
              {orderPrice.toLocaleString()}
            </Text>
            <Progress
              value={(orderVolume / (isBids ? maxBidVolume : maxAskVolume)) * 100}
              size="sm"
              colorScheme={isBids ? 'green' : 'red'}
              bg={isDarkMode ? 'gray.700' : 'gray.100'}
              width="100px"
            />
          </HStack>
        </Td>
        <Td isNumeric>
          <Text color={isDarkMode ? 'gray.300' : 'gray.600'}>
            {orderVolume.toFixed(4)}
          </Text>
        </Td>
      </Tr>
    ));
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <Center h="200px">
          <Spinner size="xl" color={isDarkMode ? 'white' : 'gray.800'} />
        </Center>
      );
    }

    if (error) {
      return (
        <Center h="200px">
          <Text color="red.400">{error}</Text>
        </Center>
      );
    }

    if (!orderBook.bids.length && !orderBook.asks.length) {
      return (
        <Center h="200px">
          <Text color={isDarkMode ? 'gray.400' : 'gray.600'}>No order book data available</Text>
        </Center>
      );
    }

    return (
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Price</Th>
            <Th isNumeric>Volume</Th>
          </Tr>
        </Thead>
        <Tbody>
          {renderOrders(orderBook.asks, false)}
          {renderOrders(orderBook.bids, true)}
        </Tbody>
      </Table>
    );
  };

  return (
    <Box
      bg={isDarkMode ? 'gray.800' : 'white'}
      borderRadius="lg"
      p={4}
      boxShadow="sm"
    >
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="bold">
            Order Book
          </Text>
          <Text fontSize="sm" color={isConnected ? 'green.400' : 'red.400'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </HStack>
        {renderContent()}
      </VStack>
    </Box>
  );
};

export default OrderBook; 