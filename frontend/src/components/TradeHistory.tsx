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
  HStack,
  Center,
} from '@chakra-ui/react';

import { useI18n } from '../i18n';

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
  const { t } = useI18n();

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <HStack justify="space-between" mb={2} px={1}>
        <Text fontSize="xs" fontWeight="bold" letterSpacing="tight" color="gray.400">{t('label.activity_log')}</Text>
      </HStack>

      {trades.length === 0 ? (
        <Center h="100%">
            <Text fontSize="10px" color="ui.muted">NO RECENT MARKET ACTIVITY</Text>
        </Center>
      ) : (
        <Box overflowY="auto" flex={1}>
            <Table variant="unstyled" size="xs">
                <Thead>
                    <Tr borderBottom="1px" borderColor="ui.border">
                        <Th fontSize="9px" color="ui.muted">TIME</Th>
                        <Th fontSize="9px" color="ui.muted" isNumeric>PRICE</Th>
                        <Th fontSize="9px" color="ui.muted" isNumeric>AMOUNT</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {trades.map((trade, index) => (
                    <Tr key={index} height="20px" _hover={{ bg: 'whiteAlpha.50' }}>
                        <Td py={1} fontSize="9px" color="ui.muted">{trade.time}</Td>
                        <Td 
                            py={1}
                            color={trade.type === 'buy' ? 'status.success' : 'status.error'} 
                            isNumeric
                            fontSize="10px"
                            fontWeight="600"
                        >
                        {trade.price.toLocaleString()}
                        </Td>
                        <Td py={1} color="gray.400" isNumeric fontSize="10px" fontFamily="mono">
                            {trade.amount.toFixed(4)}
                        </Td>
                    </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
      )}
    </Box>
  );
};

export default TradeHistory;
