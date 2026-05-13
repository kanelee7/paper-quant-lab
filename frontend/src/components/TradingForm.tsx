import React from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';

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
  const selectBg = useColorModeValue('gray.50', 'gray.800');
  const selectBorder = useColorModeValue('gray.200', 'gray.600');
  const selectHoverBg = useColorModeValue('gray.100', 'gray.700');

  return (
    <VStack spacing={4} align="stretch">
      <FormControl>
        <FormLabel>마켓</FormLabel>
        <Select
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value)}
          bg={selectBg}
          borderColor={selectBorder}
          _hover={{ bg: selectHoverBg }}
          sx={{
            '& option': {
              bg: selectBg,
              color: useColorModeValue('gray.800', 'white'),
            }
          }}
        >
          <option value="BTC/USDT">BTC/USDT</option>
          <option value="ETH/USDT">ETH/USDT</option>
          <option value="XRP/USDT">XRP/USDT</option>
          <option value="LOKA/USDT">LOKA/USDT</option>
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>주문 유형</FormLabel>
        <Select
          defaultValue="limit"
          bg={selectBg}
          borderColor={selectBorder}
          _hover={{ bg: selectHoverBg }}
          sx={{
            '& option': {
              bg: selectBg,
              color: useColorModeValue('gray.800', 'white'),
            }
          }}
        >
          <option value="market">시장가</option>
          <option value="limit">지정가</option>
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>수량</FormLabel>
        <Input
          type="number"
          placeholder="0.00"
          bg={selectBg}
          borderColor={selectBorder}
          _hover={{ borderColor: 'blue.500' }}
        />
      </FormControl>

      <FormControl>
        <FormLabel>가격</FormLabel>
        <Input
          type="number"
          placeholder="0.00"
          bg={selectBg}
          borderColor={selectBorder}
          _hover={{ borderColor: 'blue.500' }}
        />
      </FormControl>

      <Button
        colorScheme="green"
        size="lg"
        width="100%"
        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
      >
        매수
      </Button>
      <Button
        colorScheme="red"
        size="lg"
        width="100%"
        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
      >
        매도
      </Button>

      <Button
        colorScheme={isTrading ? 'red' : 'blue'}
        onClick={isTrading ? onStopTrading : onStartTrading}
        size="lg"
        width="100%"
        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
      >
        {isTrading ? '자동 매매 중지' : '자동 매매 시작'}
      </Button>
    </VStack>
  );
};

export default TradingForm; 