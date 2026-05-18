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
  Checkbox,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Icon,
} from '@chakra-ui/react';
import { AddIcon, WarningIcon, InfoIcon } from '@chakra-ui/icons';

interface Review {
  review_id: string;
  title: string;
  summary: string;
  linked_sessions: string[];
  linked_insights: string[];
  key_findings: string[];
  failure_patterns: string[];
  created_at: string;
  review_scope: string;
  governance?: {
    evidence_coverage_score: number;
    reliability_flags: string[];
    audit_trail: {
      version: number;
      last_updated: string;
      synthesis_method: string;
    };
  };
}

const ResearchReviewBoard: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [contradictions, setContradictions] = useState<any[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [synthesisData, setSynthesisData] = useState<any>(null);
  const [governanceReport, setGovernanceReport] = useState<any>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  
  const [newReview, setNewReview] = useState({
    title: '',
    summary: '',
    linked_sessions: [] as string[],
    linked_insights: [] as string[]
  });
  
  const toast = useToast();

  const fetchReviews = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/reviews');
      const data = await response.json();
      setReviews(data.reverse());
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const fetchContradictions = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/reviews/contradictions');
      const data = await response.json();
      setContradictions(data);
    } catch (error) {
      console.error('Failed to fetch contradictions:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/insights');
      const data = await response.json();
      setInsights(data);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchSessions();
    fetchInsights();
    fetchContradictions();
  }, []);

  const handleCreateReview = async () => {
    if (!newReview.title || newReview.linked_sessions.length === 0) {
      toast({ title: 'Title and at least one session required', status: 'warning' });
      return;
    }
    
    try {
      const sessionIds = newReview.linked_sessions.join(',');
      const synthRes = await demoFetch(`http://localhost:8000/api/reviews/synthesis?session_ids=${sessionIds}`);
      const synthData = await synthRes.json();
      
      const response = await demoFetch('http://localhost:8000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newReview,
          summary: newReview.summary || synthData.summary,
          key_findings: (Object.entries(synthData.persona_stats || {}) || []).map(([pid, stats]: any) => 
            `${pid}: Win Rate ${stats.win_rate}%, Avg Return ${stats.avg_return}%`
          ),
          failure_patterns: synthData.frequent_failures
        })
      });
      
      if (response.ok) {
        toast({ title: 'Research Review Created', status: 'success' });
        fetchReviews();
        fetchContradictions();
        onClose();
        setNewReview({ title: '', summary: '', linked_sessions: [], linked_insights: [] });
      }
    } catch (error) {
      toast({ title: 'Failed to create review', status: 'error' });
    }
  };

  const handleOpenDetail = async (review: Review) => {
    setSelectedReview(review);
    setSynthesisData(null);
    setGovernanceReport(null);
    onDetailOpen();
    
    try {
      const sessionIds = review.linked_sessions.join(',');
      const response = await demoFetch(`http://localhost:8000/api/reviews/synthesis?session_ids=${sessionIds}`);
      const data = await response.json();
      setSynthesisData(data);
      
      const govRes = await demoFetch(`http://localhost:8000/api/reviews/${review.review_id}/governance`);
      const govData = await govRes.json();
      setGovernanceReport(govData);
    } catch (error) {
      console.error('Failed to fetch synthesis or governance detail:', error);
    }
  };

  const toggleSessionSelection = (sessionId: string) => {
    if (newReview.linked_sessions.includes(sessionId)) {
      setNewReview({ ...newReview, linked_sessions: newReview.linked_sessions.filter(id => id !== sessionId) });
    } else {
      setNewReview({ ...newReview, linked_sessions: [...newReview.linked_sessions, sessionId] });
    }
  };

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <HStack justifyContent="space-between" mb={4}>
        <Heading size="xs" color="gray.400" letterSpacing="widest" textTransform="uppercase">Narratives</Heading>
        <IconButton 
          size="xs" 
          variant="ghost"
          colorScheme="brand" 
          aria-label="Add Review" 
          icon={<AddIcon />} 
          onClick={onOpen} 
        />
      </HStack>

      {contradictions.length > 0 && (
        <Box mb={4} p={2} bg="orange.900" borderRadius="md" border="1px solid" borderColor="orange.500">
            <HStack spacing={2}>
                <WarningIcon color="orange.300" w={3} h={3} />
                <Text fontSize="10px" fontWeight="bold" color="orange.100">
                    {contradictions.length} Contradictions Detected
                </Text>
            </HStack>
        </Box>
      )}

      <VStack align="stretch" spacing={3}>
        {reviews.length === 0 ? (
          <Text fontSize="11px" color="ui.muted" fontStyle="italic">No narratives synthesized yet.</Text>
        ) : (
          (reviews || []).map(review => (
            <Box 
              key={review.review_id} 
              p={3} 
              bg="blackAlpha.300" 
              borderRadius="md" 
              borderWidth="1px"
              borderColor="ui.border"
              borderLeft="3px solid" 
              borderLeftColor="brand.500"
              cursor="pointer"
              _hover={{ borderColor: 'brand.500', bg: 'whiteAlpha.50' }}
              onClick={() => handleOpenDetail(review)}
            >
              <HStack justifyContent="space-between" mb={1}>
                <Text fontWeight="bold" fontSize="xs" color="gray.200" noOfLines={1}>{review.title}</Text>
                <Badge fontSize="9px" colorScheme="brand" variant="subtle">{review.review_scope}</Badge>
              </HStack>
              <Text fontSize="10px" color="ui.muted" mb={2} noOfLines={2}>{review.summary}</Text>
              <HStack justifyContent="space-between">
                <HStack spacing={2}>
                    <Text fontSize="9px" color="gray.600">{new Date(review.created_at).toLocaleDateString()}</Text>
                    {review.governance && (
                        <Badge variant="outline" colorScheme={review.governance.evidence_coverage_score > 0.7 ? "green" : "orange"} fontSize="9px">
                            Reliability: {Math.round(review.governance.evidence_coverage_score * 100)}%
                        </Badge>
                    )}
                </HStack>
                <Text fontSize="9px" color="blue.400" fontWeight="bold">{review.linked_sessions.length} Sessions</Text>
              </HStack>
            </Box>
          ))
        )}
      </VStack>

      {/* Review Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="background.surface" color="white" borderWidth="1px" borderColor="ui.border" borderRadius="xl">
          <ModalHeader fontSize="md" fontWeight="bold" borderBottomWidth="1px" borderColor="ui.border">Narrative Synthesis</ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            {selectedReview && (
              <VStack align="stretch" spacing={6}>
                <HStack justifyContent="space-between" p={3} bg="blackAlpha.400" borderRadius="md" borderWidth="1px" borderColor="ui.border">
                    <VStack align="start" spacing={0}>
                        <Text fontSize="10px" color="ui.muted" fontWeight="bold">GOVERNANCE</Text>
                        <Text fontSize="9px" color="gray.600">Audit v{selectedReview.governance?.audit_trail.version}</Text>
                    </VStack>
                    {governanceReport && (
                        <HStack spacing={4}>
                            <VStack align="end" spacing={0}>
                                <Text fontSize="9px" color="ui.muted">Coverage</Text>
                                <Text fontSize="xs" fontWeight="bold" color={governanceReport.coverage_score > 0.7 ? "green.300" : "orange.300"}>
                                    {Math.round(governanceReport.coverage_score * 100)}%
                                </Text>
                            </VStack>
                            <Divider orientation="vertical" h="20px" borderColor="ui.border" />
                            <VStack align="end" spacing={0}>
                                <Text fontSize="9px" color="ui.muted">Status</Text>
                                <Badge colorScheme={governanceReport.flags.length === 0 ? "green" : "red"} fontSize="9px" variant="solid">
                                    {governanceReport.flags.length === 0 ? "STABLE" : "WEAK EVIDENCE"}
                                </Badge>
                            </VStack>
                        </HStack>
                    )}
                </HStack>

                <Box>
                  <Text fontSize="10px" color="ui.muted" fontWeight="bold" mb={2} textTransform="uppercase">Executive Summary</Text>
                  <Text fontSize="sm" lineHeight="relaxed" color="gray.200">{selectedReview.summary}</Text>
                </Box>

                {synthesisData && (
                  <>
                    <Box>
                      <Text fontSize="10px" color="ui.muted" fontWeight="bold" mb={3} textTransform="uppercase">Longitudinal Performance</Text>
                      <SimpleGrid columns={2} spacing={4}>
                        {(Object.entries(synthesisData.persona_stats || {}) || []).map(([pid, stats]: any) => (
                          <Box key={pid} p={3} bg="blackAlpha.300" borderRadius="md" borderTop="2px solid" borderTopColor="blue.500" borderWidth="1px" borderColor="ui.border">
                            <Text fontWeight="bold" fontSize="xs" mb={2} color="gray.100">{pid}</Text>
                            <HStack spacing={6}>
                              <Stat size="sm">
                                <StatLabel fontSize="9px" color="ui.muted">Win Rate</StatLabel>
                                <StatNumber fontSize="xs" color="green.300">{stats.win_rate}%</StatNumber>
                              </Stat>
                              <Stat size="sm">
                                <StatLabel fontSize="9px" color="ui.muted">Avg Return</StatLabel>
                                <StatNumber fontSize="xs" color="blue.300">{stats.avg_return}%</StatNumber>
                              </Stat>
                            </HStack>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </Box>
                  </>
                )}

                <Box>
                  <Text fontSize="10px" color="ui.muted" fontWeight="bold" mb={2} textTransform="uppercase">Evidence Traceability</Text>
                  <HStack wrap="wrap" spacing={2}>
                    {(selectedReview.linked_sessions || []).map(sid => (
                      <Badge key={sid} colorScheme="blue" variant="outline" fontSize="9px">Session: {sid.slice(-8)}</Badge>
                    ))}
                    {(selectedReview.linked_insights || []).map(iid => (
                      <Badge key={iid} colorScheme="purple" variant="outline" fontSize="9px">Insight: {iid.slice(-8)}</Badge>
                    ))}
                  </HStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="ui.border">
            <Button size="sm" variant="ghost" onClick={onDetailClose}>Close Review</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Review Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="background.surface" color="white" borderWidth="1px" borderColor="ui.border">
          <ModalHeader fontSize="md">Synthesize Narrative</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Input 
                placeholder="Review Title..." 
                fontSize="sm"
                bg="blackAlpha.300"
                borderColor="ui.border"
                _focus={{ borderColor: 'brand.500' }}
                value={newReview.title}
                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
              />
              
              <Box>
                <Text fontSize="10px" fontWeight="bold" mb={2} color="ui.muted" textTransform="uppercase">Select Sessions</Text>
                <Box maxH="150px" overflowY="auto" bg="blackAlpha.400" p={2} borderRadius="md" borderWidth="1px" borderColor="ui.border">
                  <List spacing={2}>
                    {(sessions || []).map(s => (
                      <ListItem key={s.session_id}>
                        <Checkbox 
                          colorScheme="brand" 
                          isChecked={newReview.linked_sessions.includes(s.session_id)}
                          onChange={() => toggleSessionSelection(s.session_id)}
                        >
                          <Text fontSize="xs" color="gray.300">{s.title}</Text>
                        </Checkbox>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Box>

              <Textarea 
                placeholder="Synthesis summary (auto-generated if empty)..." 
                fontSize="sm"
                bg="blackAlpha.300"
                borderColor="ui.border"
                _focus={{ borderColor: 'brand.500' }}
                value={newReview.summary}
                onChange={(e) => setNewReview({ ...newReview, summary: e.target.value })}
              />
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="ui.border">
            <Button size="sm" colorScheme="brand" onClick={handleCreateReview}>Synthesize</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ResearchReviewBoard;
