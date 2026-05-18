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
  VStack,
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
        <Text fontSize="10px" fontWeight="800" letterSpacing="widest" color="ui.muted" textTransform="uppercase">{t('label.activity_log')}</Text>
      </HStack>

      {trades.length === 0 ? (
        <Center h="100%" flex={1} bg="blackAlpha.200" borderRadius="sm" border="1px dashed" borderColor="ui.border">
            <VStack spacing={1} opacity={0.6}>
                <Text fontSize="9px" color="ui.muted" letterSpacing="widest" fontWeight="bold">ACTIVITY QUIET</Text>
                <Text fontSize="8px" color="ui.muted">NO RECENT MARKET EVENTS DETECTED</Text>
            </VStack>
        </Center>
      ) : (
        <Box overflowY="auto" flex={1} pr={1} sx={{ '&::-webkit-scrollbar': { width: '2px' }, '&::-webkit-scrollbar-thumb': { bg: 'whiteAlpha.100' } }}>
            <Table variant="unstyled" size="xs">
                <Thead>
                    <Tr borderBottom="1px" borderColor="ui.border">
                        <Th fontSize="8px" color="ui.muted" pb={1}>TIME</Th>
                        <Th fontSize="8px" color="ui.muted" isNumeric pb={1}>PRICE</Th>
                        <Th fontSize="8px" color="ui.muted" isNumeric pb={1}>VOL</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {trades.map((trade, index) => (
                    <Tr key={index} height="18px" _hover={{ bg: 'whiteAlpha.50' }}>
                        <Td py={0.5} fontSize="9px" color="ui.muted">{trade.time}</Td>
                        <Td 
                            py={0.5}
                            color={trade.type === 'buy' ? 'status.success' : 'status.error'} 
                            isNumeric
                            fontSize="10px"
                            fontWeight="600"
                        >
                        {trade.price.toLocaleString()}
                        </Td>
                        <Td py={0.5} color="gray.400" isNumeric fontSize="10px" fontFamily="mono">
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
