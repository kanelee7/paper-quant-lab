import React, { useState, useEffect } from 'react';
import { demoFetch } from "../demo/demoFetch";
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Text,
  HStack,
  Icon,
  Divider,
  Progress,
} from '@chakra-ui/react';
import { InfoOutlineIcon } from '@chakra-ui/icons';

interface Metrics {
  total_trades?: number;
  total_decisions?: number;
  decision_count?: number;
  total_pnl?: number;
  totalPnL?: number;
  unrealized_pnl?: number;
  win_rate?: number;
  balance?: number;
  mode?: string;
  research_drift?: number;
  last_audit?: string;
}

const PerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  const fetchMetrics = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/performance');
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

  const displayDecisions = metrics.total_trades ?? metrics.total_decisions ?? metrics.decision_count ?? 0;
  const displayPnL = metrics.total_pnl ?? metrics.totalPnL ?? metrics.unrealized_pnl ?? 0;

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <HStack justify="space-between" mb={4}>
        <Text fontSize="xs" fontWeight="bold" letterSpacing="tight" color="gray.400">RESEARCH PERFORMANCE</Text>
        <Icon as={InfoOutlineIcon} w={3} h={3} color="ui.muted" />
      </HStack>
      
      <SimpleGrid columns={2} gap={4}>
        <Stat>
          <StatLabel fontSize="10px" color="ui.muted" textTransform="uppercase">Decisions</StatLabel>
          <StatNumber fontSize="md" fontWeight="800" color="gray.200">
            {Number(displayDecisions).toLocaleString()}
          </StatNumber>
          <StatHelpText fontSize="9px" color="ui.muted" m={0}>{(metrics.mode || 'UNKNOWN').toUpperCase()} MODE</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel fontSize="10px" color="ui.muted" textTransform="uppercase">Simulated PnL</StatLabel>
          <StatNumber fontSize="md" fontWeight="800" color={displayPnL >= 0 ? "status.success" : "status.error"}>
            ${Number(displayPnL).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </StatNumber>
          <StatHelpText fontSize="9px" color="ui.muted" m={0}>UNREALIZED</StatHelpText>
        </Stat>
      </SimpleGrid>

      <Divider my={4} borderColor="ui.border" />

      <SimpleGrid columns={2} gap={4}>
        <Box>
            <Text fontSize="9px" color="ui.muted" textTransform="uppercase" mb={1}>Research Drift</Text>
            <HStack spacing={2}>
                <Progress value={(metrics.research_drift || 0) * 100} size="2xs" colorScheme="orange" flex={1} bg="whiteAlpha.100" borderRadius="full" />
                <Text fontSize="10px" fontWeight="bold" color="orange.300">{Math.round((metrics.research_drift || 0) * 100)}%</Text>
            </HStack>
        </Box>
        <Box>
            <Text fontSize="9px" color="ui.muted" textTransform="uppercase" mb={1}>Last Audit</Text>
            <Text fontSize="10px" fontWeight="bold" color="brand.200">
                {metrics.last_audit ? `${Math.floor((Date.now() - new Date(metrics.last_audit).getTime()) / 3600000)}h ago` : 'NEVER'}
            </Text>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default PerformanceMetrics;
