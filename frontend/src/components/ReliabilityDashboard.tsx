import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  List,
  ListItem,
  Button,
  useToast,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import { demoFetch } from "../demo/demoFetch";
import { API_BASE_URL } from '../config/api';
import { useI18n } from '../i18n';

interface ReproducibilityReport {
  status: 'healthy' | 'degraded';
  schema_version: string;
  replay_version: string;
  broken_links: Array<{
    type: string;
    parent: string;
    target: string;
    issue: string;
  }>;
  recommendations: string[];
}

const ReliabilityDashboard: React.FC = () => {
  const { lang } = useI18n();
  const [report, setReport] = useState<ReproducibilityReport | null>(null);
  const toast = useToast();

  const fetchReport = async () => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/reliability/reproducibility`);
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Failed to fetch reproducibility report:', error);
    }
  };

  useEffect(() => {
    fetchReport();
    const interval = setInterval(fetchReport, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateBackup = async () => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/reliability/backup`, { method: 'POST' });
      if (response.ok) {
        toast({ 
            title: lang === 'ko' ? '시스템 상태 스냅샷이 생성되었습니다.' : 'Research State Snapshot Created', 
            status: 'success', 
            duration: 2000 
        });
        fetchReport();
      }
    } catch (error) {
      toast({ title: 'Snapshot failed', status: 'error' });
    }
  };

  if (!report) return null;

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <VStack align="start" spacing={0} mb={4}>
        <Text fontSize="10px" fontWeight="900" color="brand.500" letterSpacing="widest">
            {lang === 'ko' ? "시스템 무결성" : "SYSTEM PROVENANCE"}
        </Text>
        <Text fontSize="9px" color="ui.muted">
            {lang === 'ko' ? "데이터셋 안정성 관리" : "DATASET INTEGRITY & RELIABILITY"}
        </Text>
      </VStack>

      <VStack align="stretch" spacing={3}>
        <Box p={3} bg="blackAlpha.300" borderRadius="md" borderWidth="1px" borderColor="ui.border">
          <HStack justifyContent="space-between">
            <VStack align="start" spacing={0}>
                <Text fontSize="10px" color="ui.muted" fontWeight="800">SCHEMA_STATE</Text>
                <Text fontSize="9px" color="gray.400">ENGINE_VERSION: v{report.schema_version}</Text>
            </VStack>
            <Badge colorScheme={report.status === 'healthy' ? 'green' : 'orange'} fontSize="9px" borderRadius="xs">
              {(report.status || 'UNKNOWN').toUpperCase()}
            </Badge>
          </HStack>
        </Box>

        {Array.isArray(report.broken_links) && report.broken_links.length > 0 && (
          <Box p={3} bg="red.900" borderRadius="md" borderLeft="4px solid" borderColor="red.500">
            <Text fontSize="10px" fontWeight="900" color="red.100" mb={2} letterSpacing="widest">
              PROVENANCE_FAILURES [{report.broken_links.length}]
            </Text>
            <List spacing={1} maxH="80px" overflowY="auto" sx={{ '&::-webkit-scrollbar': { width: '2px' }, '&::-webkit-scrollbar-thumb': { bg: 'whiteAlpha.200' } }}>
              {(report.broken_links || []).map((link, idx) => (
                <ListItem key={idx} fontSize="8px" color="red.200" fontFamily="mono" lineHeight="short">
                  ERR: {link.issue}
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Box p={3} bg="blackAlpha.200" borderRadius="md">
          <Text fontSize="10px" fontWeight="800" color="ui.muted" mb={2}>
              {lang === 'ko' ? "유지보수 작업" : "MAINTENANCE_OP"}
          </Text>
          <VStack align="start" spacing={1.5}>
            {(Array.isArray(report.recommendations) ? report.recommendations.slice(0, 2) : []).map((rec, idx) => (
              <Text key={idx} fontSize="9px" color="gray.400" lineHeight="short">• {rec}</Text>
            ))}
          </VStack>
        </Box>

        <Button 
          size="xs" 
          leftIcon={<RepeatIcon />} 
          variant="outline" 
          colorScheme="brand" 
          onClick={handleCreateBackup}
          fontSize="10px"
          fontWeight="800"
          letterSpacing="wider"
          borderRadius="sm"
        >
          {lang === 'ko' ? "현재 상태 스냅샷 저장" : "COMMIT STATE SNAPSHOT"}
        </Button>
      </VStack>
    </Box>
  );
};

export default ReliabilityDashboard;
