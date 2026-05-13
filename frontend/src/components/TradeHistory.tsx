import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  TableContainer,
} from '@chakra-ui/react';

interface Trade {
  time: string;
  price: number;
  amount: number;
  total: number;
  type: 'buy' | 'sell';
}

interface TradeHistoryProps {
  trades: Trade[];
}

const TradeHistory: React.FC<TradeHistoryProps> = ({ trades }) => {
  return (
    <Box
      bg="gray.900"
      borderRadius="lg"
      p={3}
    >
      <Text mb={3} fontWeight="bold" color="gray.300" fontSize="sm">Trade History</Text>
      <Box
        sx={{
          '.chakra-table': {
            tableLayout: 'fixed',
            width: '100%',
          },
          'th, td': {
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }
        }}
      >
        <Table variant="unstyled" size="sm">
          <Thead>
            <Tr>
              <Th color="gray.500" fontSize="xs" width="25%">Time</Th>
              <Th color="gray.500" fontSize="xs" width="30%" isNumeric>Price(USDT)</Th>
              <Th color="gray.500" fontSize="xs" width="25%" isNumeric>Amount</Th>
              <Th color="gray.500" fontSize="xs" width="20%" isNumeric>Total</Th>
            </Tr>
          </Thead>
          <Tbody>
            {trades.map((trade, index) => (
              <Tr key={index} _hover={{ bg: 'whiteAlpha.50' }}>
                <Td color="gray.400" fontSize="xs">{trade.time}</Td>
                <Td 
                  color={trade.type === 'buy' ? 'green.400' : 'red.400'} 
                  isNumeric
                  fontSize="xs"
                >
                  {trade.price.toFixed(2)}
                </Td>
                <Td color="gray.400" isNumeric fontSize="xs">{trade.amount.toFixed(4)}</Td>
                <Td color="gray.400" isNumeric fontSize="xs">{trade.total.toFixed(2)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default TradeHistory; 