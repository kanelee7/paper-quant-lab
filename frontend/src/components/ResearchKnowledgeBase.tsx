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
  List,
  ListItem,
  IconButton,
  useDisclosure,
  Collapse,
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
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { AddIcon, InfoOutlineIcon, ViewIcon } from '@chakra-ui/icons';

interface Insight {
  insight_id: string;
  title: string;
  summary: string;
  linked_sessions: string[];
  linked_personas: string[];
  supporting_signals: string[];
  market_regimes: string[];
  failure_tags: string[];
  created_at: string;
  confidence: string;
  reproducibility?: {
    replay_version: string;
    schema_version: string;
  };
}

const ResearchKnowledgeBase: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [failures, setFailures] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null); // Reliability report
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  
  const [newInsight, setNewInsight] = useState({
    title: '',
    summary: '',
    failure_tags: [] as string[]
  });
  const toast = useToast();

  const fetchInsights = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/insights');
      const data = await response.json();
      setInsights(data.reverse());
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
  };

  const fetchReliabilityReport = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/reliability/reproducibility');
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Failed to fetch reliability report:', error);
    }
  };

  const fetchFailures = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/taxonomy/failures');
      const data = await response.json();
      setFailures(data);
    } catch (error) {
      console.error('Failed to fetch failure taxonomy:', error);
    }
  };

  useEffect(() => {
    fetchInsights();
    fetchFailures();
    fetchReliabilityReport();
  }, []);

  const handleCreateInsight = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInsight)
      });
      if (response.ok) {
        toast({ title: 'Insight Created', status: 'success' });
        fetchInsights();
        fetchReliabilityReport();
        onClose();
        setNewInsight({ title: '', summary: '', failure_tags: [] });
      }
    } catch (error) {
      toast({ title: 'Failed to create insight', status: 'error' });
    }
  };

  const toggleFailureTag = (tag: string) => {
    if (newInsight.failure_tags.includes(tag)) {
      setNewInsight({ ...newInsight, failure_tags: newInsight.failure_tags.filter(t => t !== tag) });
    } else {
      setNewInsight({ ...newInsight, failure_tags: [...newInsight.failure_tags, tag] });
    }
  };

  const handleOpenInsight = (insight: Insight) => {
    setSelectedInsight(insight);
    onDetailOpen();
  };

  const handleShowSignalOnChart = (signalId: string) => {
    const event = new CustomEvent('focus-chart-id', { detail: { signalId } });
    window.dispatchEvent(event);
    toast({ title: 'Navigating to Evidence', status: 'info', duration: 2000 });
  };

  const getBrokenLinksForInsight = (insightId: string) => {
    if (!report || !report.broken_links) return [];
    return report.broken_links.filter((l: any) => l.parent === insightId);
  };

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <HStack justifyContent="space-between" mb={4}>
        <Heading size="xs" color="gray.400" letterSpacing="widest" textTransform="uppercase">Knowledge Base</Heading>
        <IconButton 
          size="xs" 
          variant="ghost"
          colorScheme="brand" 
          aria-label="Add Insight" 
          icon={<AddIcon />} 
          onClick={onOpen} 
        />
      </HStack>

      <VStack align="stretch" spacing={3}>
        {insights.length === 0 ? (
          <Text fontSize="11px" color="ui.muted" fontStyle="italic">No synthesized insights yet.</Text>
        ) : (
          insights.map(insight => {
            const broken = getBrokenLinksForInsight(insight.insight_id);
            return (
              <Box 
                key={insight.insight_id} 
                p={3} 
                bg="blackAlpha.300" 
                borderRadius="md" 
                borderWidth="1px"
                borderColor="ui.border"
                borderLeft="3px solid" 
                borderLeftColor={broken.length > 0 ? "orange.400" : "purple.500"}
                cursor="pointer"
                _hover={{ borderColor: 'brand.500', bg: 'whiteAlpha.50' }}
                onClick={() => handleOpenInsight(insight)}
              >
                <HStack justifyContent="space-between" mb={1}>
                  <HStack spacing={1}>
                    <Text fontWeight="bold" fontSize="xs" color="gray.200" noOfLines={1}>{insight.title}</Text>
                    {broken.length > 0 && <Icon as={InfoOutlineIcon} color="orange.400" w={2} h={2} />}
                  </HStack>
                  <Badge fontSize="9px" colorScheme="purple" variant="subtle">{insight.confidence}</Badge>
                </HStack>
                <Text fontSize="10px" color="ui.muted" noOfLines={2}>{insight.summary}</Text>
              </Box>
            );
          })
        )}
      </VStack>

      <Divider my={4} borderColor="ui.border" />
      
      <Heading size="10px" color="ui.muted" mb={3} letterSpacing="wider" textTransform="uppercase">Failure Taxonomy</Heading>
      <SimpleGrid columns={2} gap={2}>
        {failures.slice(0, 4).map(f => (
          <Box key={f.id} p={2} bg="blackAlpha.200" borderRadius="sm" borderWidth="1px" borderColor="ui.border">
            <Text fontSize="9px" fontWeight="bold" color="red.300" letterSpacing="tight">{f.label.toUpperCase()}</Text>
          </Box>
        ))}
      </SimpleGrid>

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="background.surface" color="white" borderWidth="1px" borderColor="ui.border" borderRadius="xl">
          <ModalHeader fontSize="md" fontWeight="bold" borderBottomWidth="1px" borderColor="ui.border">Synthesis Detail</ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            {selectedInsight && (
              <VStack align="stretch" spacing={5}>
                <Box>
                  <Text fontSize="10px" color="ui.muted" fontWeight="bold" mb={1}>INSIGHT TITLE</Text>
                  <Text fontSize="lg" fontWeight="bold" letterSpacing="tight">{selectedInsight.title}</Text>
                </Box>
                <Box bg="blackAlpha.400" p={4} borderRadius="md" borderLeft="2px solid" borderColor="brand.500">
                  <Text fontSize="10px" color="ui.muted" fontWeight="bold" mb={2}>RESEARCH FINDING</Text>
                  <Text fontSize="sm" lineHeight="relaxed">{selectedInsight.summary}</Text>
                </Box>
                <SimpleGrid columns={2} gap={4}>
                  <Box>
                    <Text fontSize="10px" color="ui.muted" fontWeight="bold" mb={2}>FAILURE TYPES</Text>
                    <HStack wrap="wrap">
                      {selectedInsight.failure_tags.map(tag => (
                        <Badge key={tag} colorScheme="red" variant="subtle" fontSize="9px">{tag}</Badge>
                      ))}
                    </HStack>
                  </Box>
                  <Box>
                    <Text fontSize="10px" color="ui.muted" fontWeight="bold" mb={2}>REGIMES</Text>
                    <HStack wrap="wrap">
                      {selectedInsight.market_regimes.map(regime => (
                        <Badge key={regime} colorScheme="blue" variant="outline" fontSize="9px">{regime}</Badge>
                      ))}
                    </HStack>
                  </Box>
                </SimpleGrid>
                
                <Box>
                  <HStack justifyContent="space-between" mb={2}>
                    <Text fontSize="10px" color="ui.muted" fontWeight="bold" textTransform="uppercase">SUPPORTING EVIDENCE</Text>
                    {selectedInsight.supporting_signals.length > 0 && (
                        <Button size="2xs" variant="ghost" colorScheme="blue" onClick={() => setShowEvidence(!showEvidence)}>
                            {showEvidence ? 'Hide' : `Show (${selectedInsight.supporting_signals.length})`}
                        </Button>
                    )}
                  </HStack>
                  <Collapse in={showEvidence}>
                    <VStack align="stretch" spacing={2}>
                        {selectedInsight.supporting_signals.length > 0 ? (
                        selectedInsight.supporting_signals.map(sid => (
                            <HStack key={sid} bg="blackAlpha.300" p={2} borderRadius="sm" justifyContent="space-between" borderWidth="1px" borderColor="ui.border">
                            <Text fontSize="xs" color="brand.200" fontFamily="mono">Signal: {sid.slice(-8)}</Text>
                            <Button size="2xs" variant="outline" onClick={() => handleShowSignalOnChart(sid)}>
                                Replay
                            </Button>
                            </HStack>
                        ))
                        ) : (
                        <Text fontSize="xs" color="ui.muted" fontStyle="italic">No evidence linked.</Text>
                        )}
                    </VStack>
                  </Collapse>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="ui.border">
            <Button size="sm" variant="ghost" onClick={onDetailClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="background.surface" color="white" borderWidth="1px" borderColor="ui.border">
          <ModalHeader fontSize="md">New Synthesis</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Input 
                placeholder="Title..." 
                fontSize="sm"
                bg="blackAlpha.300"
                borderColor="ui.border"
                _focus={{ borderColor: 'brand.500' }}
                value={newInsight.title}
                onChange={(e) => setNewInsight({ ...newInsight, title: e.target.value })}
              />
              <Textarea 
                placeholder="Synthesized findings..." 
                fontSize="sm"
                bg="blackAlpha.300"
                borderColor="ui.border"
                _focus={{ borderColor: 'brand.500' }}
                value={newInsight.summary}
                onChange={(e) => setNewInsight({ ...newInsight, summary: e.target.value })}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" colorScheme="brand" onClick={handleCreateInsight}>Save Insight</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ResearchKnowledgeBase;
