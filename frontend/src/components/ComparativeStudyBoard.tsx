import React, { useState, useEffect } from 'react';
import { demoFetch } from "../demo/demoFetch";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  Badge,
  Divider,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  useToast,
  SimpleGrid,
  Tooltip,
  Icon,
} from '@chakra-ui/react';
import { AddIcon, InfoIcon, ExternalLinkIcon, LinkIcon } from '@chakra-ui/icons';

interface Pattern {
  pattern_id: string;
  title: string;
  description: string;
  linked_failure_types: string[];
  linked_replay_ids: string[];
  linked_personas: string[];
  linked_insight_ids: string[]; // 추가
  created_at: string;
}

const ComparativeStudyBoard: React.FC = () => {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  
  const [newPattern, setNewPattern] = useState({
    title: '',
    description: '',
    linked_failure_types: [] as string[]
  });
  
  const toast = useToast();

  const fetchPatterns = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/patterns');
      const data = await response.json();
      setPatterns(data.reverse());
    } catch (error) {
      console.error('Failed to fetch patterns:', error);
    }
  };

  const fetchPresets = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/patterns/presets');
      const data = await response.json();
      setPresets(data);
    } catch (error) {
      console.error('Failed to fetch pattern presets:', error);
    }
  };

  useEffect(() => {
    fetchPatterns();
    fetchPresets();
  }, []);

  const handleCreatePattern = async () => {
    if (!newPattern.title) {
      toast({ title: 'Title required', status: 'warning' });
      return;
    }
    
    try {
      const response = await demoFetch('http://localhost:8000/api/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPattern)
      });
      
      if (response.ok) {
        toast({ title: 'Pattern Archetype Created', status: 'success' });
        fetchPatterns();
        onClose();
        setNewPattern({ title: '', description: '', linked_failure_types: [] });
      }
    } catch (error) {
      toast({ title: 'Failed to create pattern', status: 'error' });
    }
  };

  const handleOpenDetail = (pattern: Pattern) => {
    setSelectedPattern(pattern);
    onDetailOpen();
  };

  const handleShowReplay = (signalId: string) => {
    const event = new CustomEvent('focus-chart-id', { detail: { signalId } });
    window.dispatchEvent(event);
    toast({ title: 'Navigating to Pattern Replay', status: 'info', duration: 2000 });
  };

  return (
    <Box bg="gray.800" borderRadius="lg" p={4} shadow="md">
      <HStack justifyContent="space-between" mb={4}>
        <Heading size="sm">Analytical Pattern Library</Heading>
        <IconButton 
          size="xs" 
          colorScheme="blue" 
          aria-label="Add Pattern" 
          icon={<AddIcon />} 
          onClick={onOpen} 
        />
      </HStack>

      <VStack align="stretch" spacing={3}>
        {patterns.length === 0 ? (
          <Box p={3} bg="gray.900" borderRadius="md" border="1px dashed" borderColor="gray.600">
            <Text fontSize="xs" color="gray.500" textAlign="center">
                No reusable patterns synthesized. Browse presets to start.
            </Text>
          </Box>
        ) : (
          patterns.map(pattern => (
            <Box 
              key={pattern.pattern_id} 
              p={3} 
              bg="gray.900" 
              borderRadius="md" 
              borderLeft="4px solid" 
              borderColor="blue.400"
              cursor="pointer"
              _hover={{ bg: "gray.700" }}
              onClick={() => handleOpenDetail(pattern)}
            >
              <HStack justifyContent="space-between" mb={1}>
                <Text fontWeight="bold" fontSize="xs" noOfLines={1}>{pattern.title}</Text>
                <Badge fontSize="2xs" colorScheme="blue">ARCHETYPE</Badge>
              </HStack>
              <Text fontSize="2xs" color="gray.400" noOfLines={2}>{pattern.description}</Text>
              <HStack mt={2} spacing={1}>
                <Badge variant="outline" colorScheme="orange" fontSize="2xs">{pattern.linked_replay_ids.length} Cases</Badge>
                <Badge variant="outline" colorScheme="purple" fontSize="2xs">{pattern.linked_personas.length} Personas</Badge>
              </HStack>
            </Box>
          ))
        )}
      </VStack>

      <Divider my={4} borderColor="gray.700" />
      
      <Heading size="xs" color="gray.500" mb={3} textTransform="uppercase">Reasoning Archetypes (Presets)</Heading>
      <VStack align="stretch" spacing={2}>
        {presets.map(preset => (
            <Box key={preset.id} p={2} bg="gray.900" borderRadius="sm" cursor="help">
                <HStack justifyContent="space-between">
                    <Text fontSize="xs" fontWeight="bold">{preset.title}</Text>
                    <Tooltip label={preset.description}>
                        <InfoIcon w={3} h={3} color="gray.600" />
                    </Tooltip>
                </HStack>
            </Box>
        ))}
      </VStack>

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Pattern Archetype: {selectedPattern?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedPattern && (
              <VStack align="stretch" spacing={5}>
                <Box bg="gray.900" p={4} borderRadius="md">
                  <Heading size="xs" color="gray.500" mb={2} textTransform="uppercase">Pattern Description</Heading>
                  <Text fontSize="sm">{selectedPattern.description}</Text>
                </Box>

                <Box>
                    <Heading size="xs" color="gray.500" mb={3} textTransform="uppercase">Representative Replay Cases</Heading>
                    <VStack align="stretch" spacing={2}>
                        {selectedPattern.linked_replay_ids.length > 0 ? (
                            selectedPattern.linked_replay_ids.map(rid => (
                                <HStack key={rid} bg="gray.900" p={2} borderRadius="sm" justifyContent="space-between">
                                    <HStack>
                                        <Icon as={LinkIcon} color="blue.400" w={3} h={3} />
                                        <Text fontSize="xs">Case: {rid.slice(-8)}</Text>
                                    </HStack>
                                    <Button size="2xs" leftIcon={<ExternalLinkIcon />} onClick={() => handleShowReplay(rid)}>
                                        Replay Evidence
                                    </Button>
                                </HStack>
                            ))
                        ) : (
                            <Text fontSize="xs" color="gray.600" fontStyle="italic">No specific cases linked to this archetype yet.</Text>
                        )}
                    </VStack>
                </Box>

                <Box>
                    <Heading size="xs" color="gray.500" mb={3} textTransform="uppercase">Linked Research Insights</Heading>
                    <VStack align="stretch" spacing={2}>
                        {selectedPattern.linked_insight_ids && selectedPattern.linked_insight_ids.length > 0 ? (
                            selectedPattern.linked_insight_ids.map(iid => (
                                <HStack key={iid} bg="blackAlpha.300" p={2} borderRadius="sm" justifyContent="space-between" borderWidth="1px" borderColor="ui.border">
                                    <HStack>
                                        <Icon as={ExternalLinkIcon} color="purple.400" w={3} h={3} />
                                        <Text fontSize="xs">Insight: {iid.slice(-8)}</Text>
                                    </HStack>
                                    <Button size="2xs" variant="ghost">View Synthesis</Button>
                                </HStack>
                            ))
                        ) : (
                            <Text fontSize="xs" color="ui.muted" fontStyle="italic">No specific insights linked.</Text>
                        )}
                    </VStack>
                </Box>

                <SimpleGrid columns={2} spacing={4}>
                    <Box>
                        <Heading size="xs" color="gray.500" mb={2} textTransform="uppercase">Linked Failure Modes</Heading>
                        <HStack wrap="wrap">
                            {selectedPattern.linked_failure_types.map(ft => (
                                <Badge key={ft} colorScheme="red">{ft}</Badge>
                            ))}
                        </HStack>
                    </Box>
                    <Box>
                        <Heading size="xs" color="gray.500" mb={2} textTransform="uppercase">Affected Personas</Heading>
                        <HStack wrap="wrap">
                            {selectedPattern.linked_personas.map(lp => (
                                <Badge key={lp} colorScheme="purple" variant="outline">{lp}</Badge>
                            ))}
                        </HStack>
                    </Box>
                </SimpleGrid>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button size="sm" onClick={onDetailClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Synthesize Pattern Archetype</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Input 
                placeholder="Pattern Title (e.g., Sideways Chop Blindness)" 
                value={newPattern.title}
                onChange={(e) => setNewPattern({ ...newPattern, title: e.target.value })}
              />
              <Textarea 
                placeholder="Define the reusable reasoning pattern and how to identify it..." 
                value={newPattern.description}
                onChange={(e) => setNewPattern({ ...newPattern, description: e.target.value })}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" colorScheme="blue" onClick={handleCreatePattern}>Save Archetype</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ComparativeStudyBoard;
