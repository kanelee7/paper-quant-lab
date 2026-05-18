import React, { useState, useEffect } from 'react';
import { demoFetch } from "../demo/demoFetch";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Select,
  Tag,
  TagLabel,
  TagCloseButton,
  useToast,
  Badge,
  Divider,
  Heading,
  Textarea,
  List,
  ListItem,
  IconButton,
  SimpleGrid,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from '@chakra-ui/react';
import { InfoOutlineIcon } from '@chakra-ui/icons';

interface Session {
  session_id: string;
  title: string;
  created_at: string;
  status: 'active' | 'completed';
  asset_type: string;
  market: string;
  personas: string[];
  notes: string;
  tags: string[];
}

const ResearchSessionManager: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [selectedSessionSummary, setSelectedSessionSummary] = useState<any>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newSession, setNewSession] = useState({
    title: '',
    asset_type: 'CRYPTO',
    market: 'BTC/USDT',
    personas: [] as string[],
    notes: '',
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState('');
  const toast = useToast();

  const fetchSessions = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/sessions');
      const data = await response.json();
      setSessions(data.reverse());
      
      const active = data.find((s: Session) => s.status === 'active');
      setActiveSession(active || null);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleStartSession = async () => {
    if (!newSession.title) {
      toast({ title: 'Title is required', status: 'warning' });
      return;
    }
    try {
      const response = await demoFetch('http://localhost:8000/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession)
      });
      const data = await response.json();
      setActiveSession(data);
      fetchSessions();
      toast({ title: 'Research Session Started', status: 'success' });
    } catch (error) {
      toast({ title: 'Failed to start session', status: 'error' });
    }
  };

  const handleStopSession = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/sessions/stop', { method: 'POST' });
      const stopped = await response.json();
      setActiveSession(null);
      fetchSessions();
      toast({ title: 'Research Session Completed', status: 'info' });
      
      // 세션 요약 자동 조회 및 표시
      if (stopped && stopped.session_id) {
        handleViewSummary(stopped.session_id);
      }
    } catch (error) {
      toast({ title: 'Failed to stop session', status: 'error' });
    }
  };

  const handleViewSummary = async (sessionId: string) => {
    try {
      const response = await demoFetch(`http://localhost:8000/api/sessions/${sessionId}/summary`);
      const data = await response.json();
      setSelectedSessionSummary(data);
      onOpen();
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const addTag = () => {
    if (newTag && !newSession.tags.includes(newTag)) {
      setNewSession({ ...newSession, tags: [...newSession.tags, newTag] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setNewSession({ ...newSession, tags: newSession.tags.filter(t => t !== tag) });
  };

  return (
    <Box bg="gray.800" borderRadius="lg" p={4} shadow="md">
      <Heading size="sm" mb={4}>Research Session Manager</Heading>
      
      {activeSession ? (
        <VStack align="stretch" spacing={3}>
          <Box p={3} bg="blue.900" borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
            <HStack justifyContent="space-between">
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="sm">{activeSession.title}</Text>
                <Text fontSize="xs" color="gray.400">Started: {new Date(activeSession.created_at).toLocaleString()}</Text>
              </VStack>
              <Badge colorScheme="green">ACTIVE</Badge>
            </HStack>
            <HStack mt={2} spacing={1}>
              {activeSession.tags.map(tag => (
                <Badge key={tag} variant="outline" fontSize="2xs">{tag}</Badge>
              ))}
            </HStack>
            <Button size="xs" colorScheme="red" mt={3} w="100%" onClick={handleStopSession}>
              Stop & Complete Session
            </Button>
          </Box>
        </VStack>
      ) : (
        <VStack align="stretch" spacing={3}>
          <Input 
            placeholder="Session Title (e.g., Volatility Study v1)" 
            size="sm" 
            value={newSession.title}
            onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
          />
          <HStack>
            <Select 
              size="sm" 
              value={newSession.asset_type}
              onChange={(e) => setNewSession({ ...newSession, asset_type: e.target.value })}
            >
              <option value="CRYPTO">Crypto</option>
              <option value="STOCK">Stock</option>
            </Select>
            <Input 
              placeholder="Market" 
              size="sm" 
              value={newSession.market}
              onChange={(e) => setNewSession({ ...newSession, market: e.target.value })}
            />
          </HStack>
          <Textarea 
            placeholder="Hypothesis / Notes" 
            size="sm" 
            value={newSession.notes}
            onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
          />
          <HStack>
            <Input 
              placeholder="Add Tag" 
              size="sm" 
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
            />
            <Button size="sm" onClick={addTag}>Add</Button>
          </HStack>
          <HStack wrap="wrap">
            {newSession.tags.map(tag => (
              <Tag key={tag} size="sm" colorScheme="blue">
                <TagLabel>{tag}</TagLabel>
                <TagCloseButton onClick={() => removeTag(tag)} />
              </Tag>
            ))}
          </HStack>
          <Button size="sm" colorScheme="blue" onClick={handleStartSession}>
            Start New Experiment
          </Button>
        </VStack>
      )}

      <Divider my={4} borderColor="gray.700" />
      
      <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2}>HISTORICAL SESSIONS</Text>
      <Box maxH="150px" overflowY="auto">
        <List spacing={2}>
          {sessions.filter(s => s.status === 'completed').map(s => (
            <ListItem key={s.session_id} p={2} bg="gray.900" borderRadius="sm">
              <HStack justifyContent="space-between">
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontSize="xs" fontWeight="bold" noOfLines={1}>{s.title}</Text>
                  <Text fontSize="2xs" color="gray.500">{new Date(s.created_at).toLocaleDateString()}</Text>
                </VStack>
                <HStack>
                  <Badge fontSize="2xs">{s.market}</Badge>
                  <IconButton 
                    size="xs" 
                    icon={<InfoOutlineIcon />} 
                    aria-label="View Summary" 
                    onClick={() => handleViewSummary(s.session_id)}
                  />
                </HStack>
              </HStack>
            </ListItem>
          ))}
        </List>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Experiment Synthesis & Summary</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedSessionSummary ? (
              <VStack align="stretch" spacing={4}>
                <Box p={3} bg="gray.900" borderRadius="md">
                  <Text fontWeight="bold" fontSize="xs" mb={2} color="gray.400">AUTOMATIC SUMMARY</Text>
                  <Text fontSize="sm">{selectedSessionSummary.summary}</Text>
                </Box>

                <SimpleGrid columns={2} gap={4}>
                  <Box p={3} bg="gray.900" borderRadius="md">
                    <Text fontWeight="bold" fontSize="xs" mb={2} color="gray.400">TOP REASONING PATTERNS</Text>
                    <HStack wrap="wrap" spacing={1}>
                      {selectedSessionSummary.top_patterns.map((p: string) => (
                        <Badge key={p} colorScheme="blue" variant="outline" fontSize="2xs">{p}</Badge>
                      ))}
                    </HStack>
                  </Box>
                  <Box p={3} bg="gray.900" borderRadius="md">
                    <Text fontWeight="bold" fontSize="xs" mb={2} color="gray.400">FREQUENT FAILURES</Text>
                    <HStack wrap="wrap" spacing={1}>
                      {selectedSessionSummary.frequent_failures.map((f: string) => (
                        <Badge key={f} colorScheme="red" variant="solid" fontSize="2xs">{f}</Badge>
                      ))}
                    </HStack>
                  </Box>
                </SimpleGrid>

                <HStack justifyContent="space-between" p={3} bg="blue.900" borderRadius="md">
                  <Text fontSize="xs" fontWeight="bold">Strongest Regime:</Text>
                  <Badge colorScheme="green">{selectedSessionSummary.strongest_regime.toUpperCase()}</Badge>
                </HStack>

                <Box>
                  <Text fontSize="xs" color="gray.500">Generated from {selectedSessionSummary.signal_count} decisions at {new Date(selectedSessionSummary.generated_at).toLocaleString()}</Text>
                </Box>
              </VStack>
            ) : (
              <Text>Loading summary...</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button size="sm" colorScheme="blue" onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ResearchSessionManager;
