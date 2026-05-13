import React, { useState } from 'react';
import {
  Box,
  Grid,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';
import PriceChart from '../components/PriceChart';
import OrderBook from '../components/OrderBook';
import TradeHistory from '../components/TradeHistory';

const Dashboard = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');

  return (
    <Box>
      <Heading mb={6}>Trading Dashboard</Heading>
      
      <Grid templateColumns="repeat(3, 1fr)" gap={6} mb={8}>
        <Stat>
          <StatLabel>Current Price</StatLabel>
          <StatNumber>$45,000</StatNumber>
          <StatHelpText>
            <StatArrow type="increase" />
            2.5%
          </StatHelpText>
        </Stat>
        
        <Stat>
          <StatLabel>24h Volume</StatLabel>
          <StatNumber>1,234 BTC</StatNumber>
          <StatHelpText>
            <StatArrow type="decrease" />
            1.2%
          </StatHelpText>
        </Stat>
        
        <Stat>
          <StatLabel>Balance</StatLabel>
          <StatNumber>0.5 BTC</StatNumber>
          <StatHelpText>≈ $22,500</StatHelpText>
        </Stat>
      </Grid>

      <Grid templateColumns="2fr 1fr" gap={6}>
        <Box>
          <PriceChart
            symbol={selectedSymbol}
            onSymbolChange={setSelectedSymbol}
          />
        </Box>
        <Box>
          <OrderBook symbol={selectedSymbol} />
        </Box>
      </Grid>

      <Box mt={8}>
        <TradeHistory trades={[]} />
      </Box>
    </Box>
  );
};

export default Dashboard; 