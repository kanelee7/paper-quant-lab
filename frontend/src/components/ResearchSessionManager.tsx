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
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { 
  RepeatIcon, 
  SearchIcon,
  LinkIcon,
} from '@chakra-ui/icons';

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

  const fetchSessions = React.useCallback(async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/sessions');
      const data = await response.json();
      setSessions(data);
      
      const active = data.find((s: Session) => s.status === 'active');
      setActiveSession(active || null);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

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

  // Group archived sessions by market
  const archivedSessionsByMarket = sessions
    .filter(s => s.status === 'completed')
    .reduce((acc, s) => {
      if (!acc[s.market]) acc[s.market] = [];
      acc[s.market].push(s);
      return acc;
    }, {} as Record<string, Session[]>);

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <VStack align="start" spacing={0} mb={4}>
        <Text fontSize="10px" fontWeight="900" color="brand.500" letterSpacing="widest">SESSIONS</Text>
        <Text fontSize="9px" color="ui.muted">ACTIVE INVESTIGATION</Text>
      </VStack>
      
      {activeSession ? (
        <VStack align="stretch" spacing={3}>
          <Box p={4} bg="brand.900" borderRadius="md" borderLeft="4px solid" borderColor="brand.500" position="relative">
            <VStack align="stretch" spacing={3}>
                <HStack justifyContent="space-between">
                    <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" fontSize="sm" color="white">{activeSession.title}</Text>
                        <Text fontSize="10px" color="brand.200" fontWeight="700">ACTIVE</Text>
                    </VStack>
                    <Badge colorScheme="brand" variant="solid" fontSize="8px" px={2} borderRadius="xs">LIVE</Badge>
                </HStack>
                
                <SimpleGrid columns={2} spacing={2}>
                    <Box>
                        <Text fontSize="9px" color="ui.muted" fontWeight="800">STARTED</Text>
                        <Text fontSize="10px" color="gray.300">{new Date(activeSession.start_time || activeSession.created_at).toLocaleTimeString()}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="9px" color="ui.muted" fontWeight="800">RECORDS</Text>
                        <Text fontSize="10px" color="gray.300">{activeSession.signal_count || 0} Traces</Text>
                    </Box>
                </SimpleGrid>

                <Box p={2} bg="blackAlpha.400" borderRadius="xs" border="1px solid" borderColor="whiteAlpha.100">
                    <Text fontSize="9px" color="brand.500" fontWeight="900" mb={1}>NEXT STEP</Text>
                    <Text fontSize="10px" color="gray.100">
                        {activeSession.signal_count && activeSession.signal_count > 0 
                            ? "Inspect replay traces in the Replay panel." 
                            : "Awaiting market data. Monitor chart for signals."}
                    </Text>
                </Box>

                <HStack wrap="wrap" spacing={1}>
                {(activeSession.tags || []).map(tag => (
                    <Badge key={tag} variant="outline" fontSize="8px" colorScheme="brand" borderRadius="xs">{tag}</Badge>
                ))}
                </HStack>

                <Button size="xs" colorScheme="red" mt={1} w="100%" onClick={handleStopSession} fontSize="9px" borderRadius="sm" fontWeight="800">
                FINALIZE & ARCHIVE
                </Button>
            </VStack>
          </Box>
        </VStack>
      ) : (
        <VStack align="stretch" spacing={3}>
          <Input 
            placeholder="Research Title" 
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
            placeholder="Research objective or parameters..." 
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
            START RESEARCH RUN
          </Button>
        </VStack>
      )}

      <Divider my={4} borderColor="ui.border" />
      
      <HStack justifyContent="space-between" mb={2}>
        <Text fontSize="10px" fontWeight="800" color="ui.muted" letterSpacing="widest">ARCHIVE</Text>
        <Badge fontSize="8px" variant="outline" colorScheme="gray">{Object.keys(archivedSessionsByMarket).length} MARKETS</Badge>
      </HStack>

      <Box maxH="300px" overflowY="auto" pr={1} sx={{ '&::-webkit-scrollbar': { width: '2px' }, '&::-webkit-scrollbar-thumb': { bg: 'whiteAlpha.100' } }}>
        <VStack align="stretch" spacing={4}>
          {Object.entries(archivedSessionsByMarket).map(([market, marketSessions]) => (
            <Box key={market}>
              <HStack spacing={2} mb={1} px={1}>
                <Icon as={RepeatIcon} w={2} h={2} color="brand.500" />
                <Text fontSize="9px" fontWeight="bold" color="brand.200">{market} STREAM</Text>
                <Divider flex={1} borderColor="whiteAlpha.100" />
              </HStack>
              <List spacing={1.5}>
                {marketSessions.map(s => {
                  const sTags = Array.isArray(s.tags) ? s.tags : [];
                  const activeTags = activeSession && Array.isArray(activeSession.tags) ? activeSession.tags : [];
                  const isRelated = activeSession && (s.market === activeSession.market || sTags.some(t => activeTags.includes(t)));
                  return (
                    <ListItem 
                      key={s.session_id} 
                      p={2} 
                      bg="blackAlpha.300" 
                      borderRadius="md" 
                      borderWidth="1px" 
                      borderColor={isRelated ? "brand.900" : "ui.border"} 
                      _hover={{ borderColor: 'brand.500', bg: 'blackAlpha.400' }}
                      transition="all 0.2s"
                      position="relative"
                    >
                      <VStack align="stretch" spacing={1}>
                        <HStack justifyContent="space-between">
                          <VStack align="start" spacing={0} flex={1} cursor="pointer" onClick={() => handleViewSummary(s.session_id)}>
                            <HStack spacing={1}>
                                <Text fontSize="xs" fontWeight="bold" noOfLines={1} color="gray.200">{s.title}</Text>
                                {isRelated && (
                                    <Tooltip label="Continuity Detected: Same Market/Tags" fontSize="9px">
                                        <Icon as={LinkIcon} w={2} h={2} color="brand.500" />
                                    </Tooltip>
                                )}
                            </HStack>
                            <HStack spacing={2}>
                                <Text fontSize="9px" color="ui.muted">{new Date(s.end_time || s.created_at).toLocaleDateString()}</Text>
                                <Text fontSize="9px" color="ui.muted" borderLeft="1px solid" borderColor="whiteAlpha.100" pl={2}>
                                    {s.signal_count || 0} TRACES
                                </Text>
                            </HStack>
                          </VStack>
                          <IconButton 
                            size="2xs" 
                            variant="ghost"
                            icon={<SearchIcon w={2} h={2} />} 
                            aria-label="Inspect Archive" 
                            onClick={() => handleViewSummary(s.session_id)}
                          />
                        </HStack>
                        
                        <HStack wrap="wrap" spacing={1} mt={1}>
                            {sTags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="outline" fontSize="7px" px={1} colorScheme="gray" borderRadius="xs">{tag}</Badge>
                            ))}
                            {sTags.length > 3 && <Text fontSize="7px" color="ui.muted">+{sTags.length - 3}</Text>}
                        </HStack>
                      </VStack>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          ))}
          {Object.keys(archivedSessionsByMarket).length === 0 && (
            <Text fontSize="10px" color="ui.muted" fontStyle="italic" textAlign="center" py={4}>No archived research repositories found.</Text>
          )}
        </VStack>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="background.surface" color="white" borderWidth="1px" borderColor="ui.border" borderRadius="md">
          <ModalHeader fontSize="md" fontWeight="bold">Session Summary</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedSessionSummary ? (
              <VStack align="stretch" spacing={4}>
                <Box p={3} bg="blackAlpha.400" borderRadius="md" borderLeft="2px solid" borderColor="brand.500">
                  <Text fontWeight="800" fontSize="9px" mb={2} color="ui.muted" letterSpacing="widest">SUMMARY</Text>
                  <Text fontSize="sm" lineHeight="relaxed">{selectedSessionSummary.summary}</Text>
                </Box>

                <SimpleGrid columns={2} gap={4}>
                  <Box p={3} bg="blackAlpha.300" borderRadius="md" borderWidth="1px" borderColor="ui.border">
                    <Text fontWeight="800" fontSize="9px" mb={2} color="ui.muted" letterSpacing="widest">TOP PATTERNS</Text>
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

                <Box p={3} bg="blackAlpha.200" borderRadius="md" borderWidth="1px" borderColor="ui.border">
                    <HStack justify="space-between" mb={2}>
                        <Text fontWeight="800" fontSize="9px" color="ui.muted" letterSpacing="widest">PROVENANCE</Text>
                        <Badge fontSize="8px" variant="outline">STABLE</Badge>
                    </HStack>
                    <SimpleGrid columns={2} spacing={2}>
                        <VStack align="start" spacing={0}>
                            <Text fontSize="8px" color="ui.muted">SESSION_ID</Text>
                            <Text fontSize="10px" color="gray.400" fontFamily="mono">{selectedSessionSummary.session_id?.slice(0, 12)}</Text>
                        </VStack>
                        <VStack align="start" spacing={0}>
                            <Text fontSize="8px" color="ui.muted">GENERATED_AT</Text>
                            <Text fontSize="10px" color="gray.400">{new Date(selectedSessionSummary.generated_at).toLocaleString()}</Text>
                        </VStack>
                    </SimpleGrid>
                </Box>

                <Button 
                    size="sm" 
                    colorScheme="brand" 
                    variant="outline" 
                    leftIcon={<RepeatIcon />} 
                    fontSize="10px"
                    fontWeight="800"
                >
                    REPLAY FULL SESSION TRACE
                </Button>
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
