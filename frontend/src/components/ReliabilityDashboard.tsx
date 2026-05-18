import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  List,
  ListItem,
  Icon,
  Button,
  useToast,
  Tooltip,
} from '@chakra-ui/react';
import { WarningIcon, CheckCircleIcon, LinkIcon, RepeatIcon } from '@chakra-ui/icons';
import { demoFetch } from "../demo/demoFetch";

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
  const [report, setReport] = useState<ReproducibilityReport | null>(null);
  const toast = useToast();

  const fetchReport = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/reliability/reproducibility');
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
      const response = await demoFetch('http://localhost:8000/api/reliability/backup', { method: 'POST' });
      if (response.ok) {
        toast({ title: 'Research State Snapshot Created', status: 'success', duration: 2000 });
        fetchReport();
      }
    } catch (error) {
      toast({ title: 'Snapshot failed', status: 'error' });
    }
  };

  if (!report) return null;

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <HStack justifyContent="space-between" mb={4}>
        <Text fontSize="xs" fontWeight="bold" letterSpacing="tight" color="gray.400">DATA RELIABILITY</Text>
        <HStack spacing={2}>
          <Tooltip label="Research Engine Metadata">
            <Badge variant="subtle" fontSize="9px" colorScheme="blue">v{report.schema_version}</Badge>
          </Tooltip>
          <Icon 
            as={report.status === 'healthy' ? CheckCircleIcon : WarningIcon} 
            color={report.status === 'healthy' ? 'status.success' : 'status.warning'} 
            w={3} h={3}
          />
        </HStack>
      </HStack>

      <VStack align="stretch" spacing={3}>
        <Box p={3} bg="blackAlpha.300" borderRadius="md" borderWidth="1px" borderColor="ui.border">
          <HStack justifyContent="space-between">
            <Text fontSize="10px" color="ui.muted" fontWeight="bold">DATASET HEALTH</Text>
            <Badge colorScheme={report.status === 'healthy' ? 'green' : 'orange'} fontSize="9px">
              {report.status.toUpperCase()}
            </Badge>
          </HStack>
        </Box>

        {report.broken_links.length > 0 && (
          <Box p={3} bg="red.900" borderRadius="md" borderLeft="4px solid" borderColor="red.500">
            <Text fontSize="10px" fontWeight="800" color="red.100" mb={2}>
              <LinkIcon mr={1} w={2} h={2} /> {report.broken_links.length} BROKEN LINKS
            </Text>
            <List spacing={1} maxH="80px" overflowY="auto">
              {(report.broken_links || []).map((link, idx) => (
                <ListItem key={idx} fontSize="9px" color="red.200" fontFamily="mono">
                  • {link.issue}
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Box p={3} bg="blackAlpha.200" borderRadius="md">
          <Text fontSize="10px" fontWeight="bold" color="ui.muted" mb={2}>MAINTENANCE</Text>
          <VStack align="start" spacing={1.5}>
            {(report.recommendations.slice(0, 2) || []).map((rec, idx) => (
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
        >
          SNAPSHOT RESEARCH STATE
        </Button>
      </VStack>
    </Box>
  );
};

export default ReliabilityDashboard;
