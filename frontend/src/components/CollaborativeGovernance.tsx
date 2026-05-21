import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Button,
  Divider,
  Progress,
  Collapse,
  useDisclosure,
  IconButton,
} from '@chakra-ui/react';
import { 
  CheckCircleIcon, 
  RepeatIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@chakra-ui/icons';
import { demoFetch } from '../demo/demoFetch';

interface GovernanceConflict {
  id: string;
  type: 'Contradiction' | 'Provenance' | 'Redundancy' | 'Schema' | 'Disagreement';
  severity: 'Critical' | 'Warning' | 'Info';
  description: string;
  evidence_ids: string[];
  age_hours?: number;
  status?: string;
}

const CollaborativeGovernance: React.FC = () => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  const [conflicts, setConflicts] = useState<GovernanceConflict[]>([]);
  const [trustScore, setTrustScore] = useState(0.92);

  const fetchGovernance = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/reliability/reproducibility');
      const data = await response.json();
      if (data.broken_links) {
        setConflicts(data.broken_links);
      }
      setTrustScore(data.status === 'trusted' ? 0.98 : 0.92);
    } catch (error) {
      console.error('Failed to fetch governance:', error);
    }
  };

  useEffect(() => {
    fetchGovernance();
  }, []);

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <HStack justifyContent="space-between" mb={2}>
        <HStack spacing={2}>
            <Heading size="xs" color="brand.500" letterSpacing="widest" textTransform="uppercase">Analytical Continuity</Heading>
            <Badge variant="subtle" colorScheme="orange" fontSize="9px">DEGRADED</Badge>
        </HStack>
        <IconButton 
          size="xs" 
          variant="ghost" 
          icon={isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />} 
          onClick={onToggle}
          aria-label="Toggle Governance"
        />
      </HStack>

      <Collapse in={isOpen}>
        <VStack align="stretch" spacing={4} mt={2}>
          <Box p={3} bg="blackAlpha.300" borderRadius="md" border="1px solid" borderColor="ui.border">
            <HStack justifyContent="space-between" mb={2}>
                <Text fontSize="10px" fontWeight="bold" color="ui.muted">PROVENANCE INTEGRITY</Text>
                <Badge colorScheme={trustScore > 0.9 ? "green" : "orange"} fontSize="9px">
                    {trustScore > 0.9 ? "TRUSTED" : "UNRESOLVED DRIFT"}
                </Badge>
            </HStack>
            <Progress value={trustScore * 100} size="xs" colorScheme="orange" bg="blackAlpha.500" borderRadius="full" />
            <Text fontSize="9px" color="ui.muted" mt={2}>Validation of multi-researcher evidence layers and deterministic replay states.</Text>
          </Box>

          <VStack align="stretch" spacing={2}>
            {(conflicts || []).map(c => (
                <Box key={c.id} p={3} bg="blackAlpha.200" borderRadius="md" borderLeft="3px solid" borderColor={c.severity === 'Critical' ? 'red.500' : c.severity === 'Warning' ? 'orange.400' : 'blue.400'}>
                    <VStack align="stretch" spacing={1}>
                        <HStack justifyContent="space-between">
                            <HStack>
                                <Badge fontSize="8px" colorScheme={c.type === 'Contradiction' ? 'purple' : c.type === 'Disagreement' ? 'pink' : 'blue'}>{c.type}</Badge>
                                {c.age_hours && <Text fontSize="8px" color="ui.muted">{c.age_hours}h ago</Text>}
                            </HStack>
                            <Badge fontSize="8px" variant="ghost" colorScheme={c.status === 'unresolved' ? 'red' : 'gray'}>{(c.status || 'STALE').replace('_', ' ').toUpperCase()}</Badge>
                        </HStack>
                        <Text fontSize="xs" color="gray.300" lineHeight="tall">{c.description}</Text>
                        <HStack mt={1} spacing={2}>
                            <Button size="2xs" variant="link" colorScheme="brand" fontSize="9px">Resolve</Button>
                            <Button size="2xs" variant="link" colorScheme="gray" color="ui.muted" fontSize="9px">Archive Trace</Button>
                        </HStack>
                    </VStack>
                </Box>
            ))}
          </VStack>

          {conflicts.length === 0 && (
              <Box p={4} textAlign="center" borderRadius="md" border="1px dashed" borderColor="green.600" bg="green.900">
                  <CheckCircleIcon color="green.300" mb={2} />
                  <Text fontSize="xs" color="green.100">No collaborative conflicts detected.</Text>
              </Box>
          )}

          <Divider borderColor="ui.border" />
          
          <Button size="xs" variant="outline" color="ui.muted" fontSize="9px" leftIcon={<RepeatIcon />}>Rescan Continuity Metadata</Button>
        </VStack>
      </Collapse>
    </Box>
  );
};

export default CollaborativeGovernance;
