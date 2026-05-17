import React from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  HStack,
  Text,
  Badge,
  Divider,
} from '@chakra-ui/react';
import { useI18n } from '../i18n';

interface TradingFormProps {
  isTrading: boolean;
  onStartTrading: () => Promise<void>;
  onStopTrading: () => Promise<void>;
  symbol: string;
  onSymbolChange: (symbol: string) => void;
}

const TradingForm: React.FC<TradingFormProps> = ({
  isTrading,
  onStartTrading,
  onStopTrading,
  symbol,
  onSymbolChange,
}) => {
  const { t } = useI18n();

  return (
    <VStack spacing={4} align="stretch">
      <HStack justify="space-between" mb={1}>
        <Text fontSize="xs" fontWeight="bold" letterSpacing="tight" color="gray.400">{t('label.run_control')}</Text>
        <Badge colorScheme="orange" variant="outline" fontSize="9px">{t('status.simulation_only')}</Badge>
      </HStack>

      <HStack spacing={4}>
        <FormControl>
            <FormLabel fontSize="10px" color="ui.muted" mb={1}>SYMBOL</FormLabel>
            <Select
                size="sm"
                value={symbol}
                onChange={(e) => onSymbolChange(e.target.value)}
                bg="blackAlpha.300"
                borderColor="ui.border"
                fontSize="xs"
                fontWeight="bold"
            >
                <option value="BTC/USDT">BTC/USDT</option>
                <option value="ETH/USDT">ETH/USDT</option>
                <option value="XRP/USDT">XRP/USDT</option>
                <option value="LOKA/USDT">LOKA/USDT</option>
            </Select>
        </FormControl>

        <FormControl>
            <FormLabel fontSize="10px" color="ui.muted" mb={1}>ORDER TYPE</FormLabel>
            <Select
                size="sm"
                defaultValue="limit"
                bg="blackAlpha.300"
                borderColor="ui.border"
                fontSize="xs"
            >
                <option value="market">Market</option>
                <option value="limit">Limit</option>
            </Select>
        </FormControl>
      </HStack>

      <HStack spacing={4}>
        <FormControl>
            <FormLabel fontSize="10px" color="ui.muted" mb={1}>AMOUNT</FormLabel>
            <Input
                size="sm"
                type="number"
                placeholder="0.00"
                bg="blackAlpha.300"
                borderColor="ui.border"
                fontSize="xs"
            />
        </FormControl>

        <FormControl>
            <FormLabel fontSize="10px" color="ui.muted" mb={1}>PRICE (USDT)</FormLabel>
            <Input
                size="sm"
                type="number"
                placeholder="0.00"
                bg="blackAlpha.300"
                borderColor="ui.border"
                fontSize="xs"
            />
        </FormControl>
      </HStack>

      <HStack spacing={2} pt={2}>
        <Button
            size="sm"
            colorScheme="green"
            flex={1}
            borderRadius="sm"
            fontSize="xs"
            letterSpacing="widest"
        >
            BUY / LONG
        </Button>
        <Button
            size="sm"
            colorScheme="red"
            flex={1}
            borderRadius="sm"
            fontSize="xs"
            letterSpacing="widest"
        >
            SELL / SHORT
        </Button>
      </HStack>

      <Divider borderColor="ui.border" my={1} />

      <Button
        colorScheme={isTrading ? 'red' : 'brand'}
        variant={isTrading ? 'solid' : 'outline'}
        onClick={isTrading ? onStopTrading : onStartTrading}
        size="sm"
        width="100%"
        fontSize="xs"
        fontWeight="800"
        letterSpacing="widest"
      >
        {isTrading ? t('btn.stop_run') : t('btn.start_run')}
      </Button>
    </VStack>
  );
};

export default TradingForm;
