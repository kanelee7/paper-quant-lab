import React, { useState, useEffect } from 'react';
import { demoFetch } from "../demo/demoFetch";
import { API_BASE_URL } from '../config/api';
import { useI18n } from '../i18n';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Text,
  HStack,
  Divider,
  Progress,
  VStack,
} from '@chakra-ui/react';

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
  const { lang } = useI18n();
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  const fetchMetrics = async () => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/performance`);
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
      <VStack align="start" spacing={0} mb={4}>
        <Text fontSize="10px" fontWeight="900" color="brand.500" letterSpacing="widest">
            {lang === 'ko' ? "분석 성과" : "ANALYTICAL PERFORMANCE"}
        </Text>
        <Text fontSize="9px" color="ui.muted">
            {lang === 'ko' ? "계량 연구 지표" : "QUANTITATIVE RESEARCH METRICS"}
        </Text>
      </VStack>
      
      <SimpleGrid columns={2} gap={4}>
        <Stat>
          <StatLabel fontSize="9px" color="ui.muted" fontWeight="800">
              {lang === 'ko' ? "판단 기록" : "REASONING NODES"}
          </StatLabel>
          <StatNumber fontSize="md" fontWeight="800" color="gray.200">
            {Number(displayDecisions).toLocaleString()}
          </StatNumber>
          <StatHelpText fontSize="8px" color="ui.muted" m={0}>
              {lang === 'ko' ? "수집된 추적 기록" : "CAPTURED TRACES"}
          </StatHelpText>
        </Stat>
        <Stat>
          <StatLabel fontSize="9px" color="ui.muted" fontWeight="800">
              {lang === 'ko' ? "가상 수익" : "SIMULATED YIELD"}
          </StatLabel>
          <StatNumber fontSize="md" fontWeight="800" color={displayPnL >= 0 ? "status.success" : "status.error"}>
            ${Number(displayPnL).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </StatNumber>
          <StatHelpText fontSize="8px" color="ui.muted" m={0}>UNREALIZED_EPS</StatHelpText>
        </Stat>
      </SimpleGrid>

      <Divider my={4} borderColor="ui.border" />

      <SimpleGrid columns={2} gap={4}>
        <Box>
            <Text fontSize="9px" color="ui.muted" fontWeight="800" mb={1}>
                {lang === 'ko' ? "분석 편향(Drift)" : "LOGICAL_DRIFT"}
            </Text>
            <HStack spacing={2}>
                <Progress value={(metrics.research_drift || 0) * 100} size="2xs" colorScheme="orange" flex={1} bg="whiteAlpha.100" borderRadius="full" />
                <Text fontSize="10px" fontWeight="bold" color="orange.300">{Math.round((metrics.research_drift || 0) * 100)}%</Text>
            </HStack>
        </Box>
        <Box>
            <Text fontSize="9px" color="ui.muted" fontWeight="800" mb={1}>
                {lang === 'ko' ? "최근 감사 작업" : "LAST_AUDIT_OP"}
            </Text>
            <Text fontSize="10px" fontWeight="bold" color="brand.200">
                {metrics.last_audit ? `${Math.floor((Date.now() - new Date(metrics.last_audit).getTime()) / 3600000)}h ago` : 'SYSTEM_INIT'}
            </Text>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default PerformanceMetrics;
