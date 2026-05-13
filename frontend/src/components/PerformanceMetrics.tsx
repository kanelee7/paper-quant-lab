import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Text,
  VStack,
  HStack,
} from '@chakra-ui/react';

interface Metrics {
  total_trades: number;
  total_pnl: number;
  mode: string;
}

const PerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/performance');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) return null;

  return (
    <Box bg="gray.800" borderRadius="lg" p={4} shadow="md">
      <Text fontSize="lg" fontWeight="bold" mb={4}>Research Performance</Text>
      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
        <Stat>
          <StatLabel color="gray.400">Total Decisions</StatLabel>
          <StatNumber fontSize="2xl">{metrics.total_trades}</StatNumber>
          <StatHelpText>{metrics.mode}</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel color="gray.400">Total PnL (Simulated)</StatLabel>
          <StatNumber fontSize="2xl" color={metrics.total_pnl >= 0 ? "green.400" : "red.400"}>
            ${metrics.total_pnl.toFixed(2)}
          </StatNumber>
          <StatHelpText>Unrealized</StatHelpText>
        </Stat>
      </Grid>
    </Box>
  );
};

export default PerformanceMetrics;
