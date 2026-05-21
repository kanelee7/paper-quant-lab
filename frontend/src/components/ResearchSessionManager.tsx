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
  start_time?: string;
  end_time?: string;
  status: 'active' | 'completed';
  asset_type: string;
  market: string;
  personas: string[];
  notes: string;
  tags: string[];
  last_reviewed?: string;
  signal_count?: number;
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
      setSessions(data);
      
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
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <Heading size="xs" color="brand.500" letterSpacing="widest" textTransform="uppercase" mb={4}>Research Operations</Heading>
      
      {activeSession ? (
        <VStack align="stretch" spacing={3}>
          <Box p={3} bg="brand.900" borderRadius="md" borderLeft="4px solid" borderColor="brand.500">
            <HStack justifyContent="space-between">
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="sm">{activeSession.title}</Text>
                <Text fontSize="xs" color="brand.200">Established: {new Date(activeSession.start_time || activeSession.created_at).toLocaleString()}</Text>
              </VStack>
              <Badge colorScheme="brand" variant="solid" fontSize="9px">ACTIVE REPOSITORY</Badge>
            </HStack>
            <HStack mt={2} spacing={1}>
              {(activeSession.tags || []).map(tag => (
                <Badge key={tag} variant="outline" fontSize="8px" colorScheme="brand">{tag}</Badge>
              ))}
            </HStack>
            <Button size="xs" colorScheme="red" mt={3} w="100%" onClick={handleStopSession} fontSize="9px" borderRadius="sm">
              Finalize Research State & Archive
            </Button>
          </Box>
        </VStack>
      ) : (
        <VStack align="stretch" spacing={3}>
          <Input 
            placeholder="Analytical Hypothesis Title" 
            size="xs" 
            value={newSession.title}
            onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
            bg="background.deep"
            borderColor="ui.border"
            borderRadius="sm"
          />
          <HStack spacing={2}>
            <Select 
              size="xs" 
              value={newSession.asset_type}
              onChange={(e) => setNewSession({ ...newSession, asset_type: e.target.value })}
              bg="background.deep"
              borderColor="ui.border"
              borderRadius="sm"
            >
              <option value="CRYPTO">Crypto Feed</option>
              <option value="STOCK">Equity Feed</option>
            </Select>
            <Input 
              placeholder="Market Focus" 
              size="xs" 
              value={newSession.market}
              onChange={(e) => setNewSession({ ...newSession, market: e.target.value })}
              bg="background.deep"
              borderColor="ui.border"
              borderRadius="sm"
            />
          </HStack>
          <Textarea 
            placeholder="Core research question or constraint parameters..." 
            size="xs" 
            value={newSession.notes}
            onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
            bg="background.deep"
            borderColor="ui.border"
            borderRadius="sm"
          />
          <HStack>
            <Input 
              placeholder="Tag (e.g., #drift)" 
              size="xs" 
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              bg="background.deep"
              borderColor="ui.border"
              borderRadius="sm"
            />
            <Button size="xs" onClick={addTag} colorScheme="brand" variant="outline" fontSize="9px" borderRadius="sm">Add</Button>
          </HStack>
          <HStack wrap="wrap">
            {(newSession.tags || []).map(tag => (
              <Tag key={tag} size="sm" colorScheme="brand" variant="subtle" borderRadius="xs">
                <TagLabel fontSize="9px">{tag}</TagLabel>
                <TagCloseButton onClick={() => removeTag(tag)} />
              </Tag>
            ))}
          </HStack>
          <Button size="xs" colorScheme="brand" onClick={handleStartSession} fontWeight="800" fontSize="10px" borderRadius="sm">
            Establish Research Repository Stream
          </Button>
        </VStack>
      )}

      <Divider my={4} borderColor="ui.border" />
      
      <Text fontSize="10px" fontWeight="800" color="ui.muted" mb={2} letterSpacing="widest">HISTORICAL ARCHIVE</Text>
      <Box maxH="220px" overflowY="auto" pr={1} sx={{ '&::-webkit-scrollbar': { width: '2px' }, '&::-webkit-scrollbar-thumb': { bg: 'whiteAlpha.100' } }}>
        <List spacing={2}>
          {(sessions || []).filter(s => s.status === 'completed').map(s => (
            <ListItem key={s.session_id} p={2} bg="blackAlpha.300" borderRadius="md" borderWidth="1px" borderColor="ui.border" _hover={{ borderColor: 'brand.500' }}>
              <VStack align="stretch" spacing={1}>
                <HStack justifyContent="space-between">
                  <VStack align="start" spacing={0} flex={1}>
                    <Text fontSize="xs" fontWeight="bold" noOfLines={1} color="gray.200">{s.title}</Text>
                    <Text fontSize="9px" color="ui.muted">Archive Date: {new Date(s.end_time || s.created_at).toLocaleDateString()}</Text>
                  </VStack>
                  <IconButton 
                    size="2xs" 
                    variant="ghost"
                    icon={<InfoOutlineIcon w={3} h={3} />} 
                    aria-label="View Summary" 
                    onClick={() => handleViewSummary(s.session_id)}
                  />
                </HStack>
                <HStack justifyContent="space-between" mt={1}>
                  <HStack spacing={1}>
                    <Badge fontSize="8px" variant="outline" colorScheme="gray">{s.market}</Badge>
                    <Badge fontSize="8px" variant="outline" colorScheme="blue">{s.signal_count || 0} signals</Badge>
                  </HStack>
                  {s.last_reviewed && (
                    <Text fontSize="8px" color="brand.200" fontStyle="italic">Last reviewed {Math.floor((Date.now() - new Date(s.last_reviewed).getTime()) / 3600000)}h ago</Text>
                  )}
                </HStack>
              </VStack>
            </ListItem>
          ))}
        </List>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="background.surface" color="white" borderWidth="1px" borderColor="ui.border">
          <ModalHeader fontSize="md" fontWeight="bold">Experiment Synthesis & Summary</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedSessionSummary ? (
              <VStack align="stretch" spacing={4}>
                <Box p={3} bg="blackAlpha.400" borderRadius="md" borderLeft="2px solid" borderColor="brand.500">
                  <Text fontWeight="800" fontSize="9px" mb={2} color="ui.muted" letterSpacing="widest">AUTOMATIC SUMMARY</Text>
                  <Text fontSize="sm" lineHeight="relaxed">{selectedSessionSummary.summary}</Text>
                </Box>

                <SimpleGrid columns={2} gap={4}>
                  <Box p={3} bg="blackAlpha.300" borderRadius="md" borderWidth="1px" borderColor="ui.border">
                    <Text fontWeight="800" fontSize="9px" mb={2} color="ui.muted" letterSpacing="widest">TOP REASONING PATTERNS</Text>
                    <HStack wrap="wrap" spacing={1}>
                      {(selectedSessionSummary.top_patterns || []).map((p: string) => (
                        <Badge key={p} colorScheme="brand" variant="outline" fontSize="9px">{p}</Badge>
                      ))}
                    </HStack>
                  </Box>
                  <Box p={3} bg="blackAlpha.300" borderRadius="md" borderWidth="1px" borderColor="ui.border">
                    <Text fontWeight="800" fontSize="9px" mb={2} color="ui.muted" letterSpacing="widest">FREQUENT FAILURES</Text>
                    <HStack wrap="wrap" spacing={1}>
                      {(selectedSessionSummary.frequent_failures || []).map((f: string) => (
                        <Badge key={f} colorScheme="red" variant="solid" fontSize="9px">{f}</Badge>
                      ))}
                    </HStack>
                  </Box>
                </SimpleGrid>

                <HStack justifyContent="space-between" p={3} bg="brand.900" borderRadius="md" color="brand.100">
                  <Text fontSize="xs" fontWeight="bold">Strongest Regime:</Text>
                  <Badge colorScheme="brand" variant="solid" fontSize="10px">{(selectedSessionSummary.strongest_regime || 'UNKNOWN').toUpperCase()}</Badge>
                </HStack>

                <Box>
                  <Text fontSize="10px" color="ui.muted">Generated from {selectedSessionSummary.signal_count} decisions at {new Date(selectedSessionSummary.generated_at).toLocaleString()}</Text>
                </Box>
              </VStack>
            ) : (
              <Text fontSize="xs" color="ui.muted">Loading summary...</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ResearchSessionManager;
