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
  type: 'Contradiction' | 'Provenance' | 'Redundancy' | 'Schema';
  severity: 'Critical' | 'Warning' | 'Info';
  description: string;
  evidence_ids: string[];
}

const CollaborativeGovernance: React.FC = () => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: false });
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
            <Heading size="xs" color="brand.500" letterSpacing="widest" textTransform="uppercase">Shared Governance</Heading>
            <Badge variant="subtle" colorScheme="green" fontSize="9px">ACTIVE SCAN</Badge>
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
                <Text fontSize="10px" fontWeight="bold" color="ui.muted">ARCHIVE TRUST DIAGNOSTIC</Text>
                <Badge colorScheme={trustScore > 0.9 ? "green" : "orange"} fontSize="9px">
                    {trustScore > 0.9 ? "TRUSTED" : "UNVERIFIED"}
                </Badge>
            </HStack>
            <Progress value={trustScore * 100} size="xs" colorScheme="green" bg="blackAlpha.500" borderRadius="full" />
            <Text fontSize="9px" color="ui.muted" mt={2}>System-wide validation of shared evidence and provenance metadata.</Text>
          </Box>

          <VStack align="stretch" spacing={2}>
            {conflicts.map(c => (
                <Box key={c.id} p={3} bg="blackAlpha.200" borderRadius="md" borderLeft="3px solid" borderColor={c.severity === 'Critical' ? 'red.500' : 'orange.400'}>
                    <VStack align="stretch" spacing={1}>
                        <HStack justifyContent="space-between">
                            <Badge fontSize="8px" colorScheme={c.type === 'Contradiction' ? 'purple' : 'blue'}>{c.type}</Badge>
                            <Text fontSize="9px" fontWeight="bold" color={c.severity === 'Critical' ? 'red.400' : 'orange.300'}>{c.severity.toUpperCase()}</Text>
                        </HStack>
                        <Text fontSize="xs" color="gray.300" lineHeight="tall">{c.description}</Text>
                        <HStack mt={1}>
                            <Button size="2xs" variant="ghost" colorScheme="brand" fontSize="9px">Resolve Conflict</Button>
                            <Button size="2xs" variant="ghost" colorScheme="blue" fontSize="9px">Audit Trace</Button>
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
          
          <Button size="xs" variant="outline" color="ui.muted" fontSize="9px" leftIcon={<RepeatIcon />}>Rescan Shared Contexts</Button>
        </VStack>
      </Collapse>
    </Box>
  );
};

export default CollaborativeGovernance;
