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
  Spinner,
  Center,
  Badge,
} from '@chakra-ui/react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useI18n } from '../i18n';

interface OrderBookProps {
  symbol: string;
}

interface OrderBookData {
  bids: [number, number][];
  asks: [number, number][];
}

const OrderBook: React.FC<OrderBookProps> = ({ symbol }) => {
  const { t } = useI18n();
  const [orderBook, setOrderBook] = useState<OrderBookData>({ bids: [], asks: [] });
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected, lastMessage } = useWebSocket(symbol);

  useEffect(() => {
    const fetchOrderBook = async () => {
      try {
        const response = await fetch(`http://localhost:8000/orderbook?symbol=${symbol}`);
        const data = await response.json();
        if (data.status === 'success') {
          setOrderBook(data.data as OrderBookData);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch order book:', error);
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
    }
  }, [lastMessage]);

  const getMaxVolume = (orders: [number, number][]) => {
    return Math.max(...orders.map(([_, volume]) => volume));
  };

  const maxVolume = Math.max(getMaxVolume(orderBook.bids), getMaxVolume(orderBook.asks), 0.0001);

  const renderOrders = (orders: [number, number][], isBids: boolean) => {
    const sortedOrders = [...orders].sort((a, b) => 
      isBids ? b[0] - a[0] : a[0] - b[0]
    ).slice(0, 10);

    return sortedOrders.map(([orderPrice, orderVolume], index) => (
      <Tr key={index} height="20px">
        <Td py={1} border="none">
            <Text fontSize="10px" fontWeight="600" color={isBids ? 'status.success' : 'status.error'}>
              {orderPrice.toLocaleString()}
            </Text>
        </Td>
        <Td py={1} isNumeric position="relative" border="none">
          <Box 
            position="absolute" 
            right={0} 
            top={0} 
            h="100%" 
            w={`${(orderVolume / maxVolume) * 100}%`} 
            bg={isBids ? 'green.900' : 'red.900'} 
            opacity={0.3} 
            zIndex={0}
          />
          <Text fontSize="10px" color="gray.400" position="relative" zIndex={1} fontFamily="mono">
            {orderVolume.toFixed(4)}
          </Text>
        </Td>
      </Tr>
    ));
  };

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <HStack justify="space-between" mb={2} px={1}>
        <Text fontSize="xs" fontWeight="bold" letterSpacing="tight" color="gray.400">{t('label.market_depth')}</Text>
        <Badge variant="subtle" fontSize="8px" colorScheme={isConnected ? 'green' : 'gray'}>
            {isConnected ? t('status.live') : t('status.idle')}
        </Badge>
      </HStack>
      
      {isLoading ? (
        <Center h="100%">
            <VStack spacing={2}>
                <Spinner size="xs" color="brand.500" />
                <Text fontSize="9px" color="ui.muted">SYNCING LEDGER</Text>
            </VStack>
        </Center>
      ) : (
        <Box overflowY="auto" flex={1}>
            <Table variant="unstyled" size="xs">
                <Thead>
                    <Tr borderBottom="1px" borderColor="ui.border">
                        <Th fontSize="9px" color="ui.muted">PRICE</Th>
                        <Th fontSize="9px" color="ui.muted" isNumeric>AMOUNT</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {renderOrders(orderBook.asks, false)}
                    <Tr height="4px" />
                    {renderOrders(orderBook.bids, true)}
                </Tbody>
            </Table>
        </Box>
      )}
    </Box>
  );
};

export default OrderBook;
