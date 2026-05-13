import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  Badge,
  Divider,
} from '@chakra-ui/react';

interface StrategyStat {
  total: number;
  buy: number;
  sell: number;
}

const QuantInsights: React.FC = () => {
  const [stats, setStats] = useState<Record<string, StrategyStat>>({});

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/strategy/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch strategy stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box bg="gray.800" borderRadius="lg" p={4} shadow="md">
      <Text fontSize="lg" fontWeight="bold" mb={4}>Quant Insights</Text>
      <VStack align="stretch" spacing={4}>
        {Object.entries(stats).length === 0 ? (
          <Text fontSize="sm" color="gray.500">No strategy data yet.</Text>
        ) : (
          Object.entries(stats).map(([name, stat]) => (
            <Box key={name} p={3} bg="gray.900" borderRadius="md">
              <HStack justifyContent="space-between" mb={2}>
                <Badge colorScheme="blue">{name.toUpperCase()}</Badge>
                <Text fontSize="xs" color="gray.400">{stat.total} Total Decisions</Text>
              </HStack>
              <HStack spacing={6}>
                <Stat size="sm">
                  <StatLabel fontSize="xs">Buy Signals</StatLabel>
                  <StatNumber fontSize="md" color="green.400">{stat.buy}</StatNumber>
                </Stat>
                <Stat size="sm">
                  <StatLabel fontSize="xs">Sell Signals</StatLabel>
                  <StatNumber fontSize="md" color="red.400">{stat.sell}</StatNumber>
                </Stat>
                <Stat size="sm">
                  <StatLabel fontSize="xs">Stability</StatLabel>
                  <StatNumber fontSize="md">
                    {((1 - (stat.buy + stat.sell) / stat.total) * 100).toFixed(0)}%
                  </StatNumber>
                </Stat>
              </HStack>
            </Box>
          ))
        )}
      </VStack>
    </Box>
  );
};

export default QuantInsights;
