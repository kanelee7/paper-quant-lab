import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  VStack,
  HStack,
  Code,
  Badge,
  Textarea,
  IconButton,
  Select,
  SimpleGrid,
  Tooltip,
  Icon,
  useToast,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  Progress,
  Avatar,
  } from '@chakra-ui/react';
  import {
  ViewIcon,
  SearchIcon,
  StarIcon,
  InfoIcon,
  QuestionOutlineIcon,
  WarningIcon,
  RepeatIcon,
  } from '@chakra-ui/icons';
  import { demoFetch } from "../demo/demoFetch";
  import ResearchCommentary from './ResearchCommentary';

  interface Signal {  id: string;
  timestamp: string;
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  price: number;
  strategy_name: string;
  persona_id?: string;
  session_id?: string;
  reason: string;
  reasoning_trace?: string;
  market_regime?: string;
  outcomes?: Record<string, { pct: number; price_delta: number }>;
  indicators_snapshot: any;
  order_id?: string;
  notes?: string;
  tags?: string[];
  evaluation?: {
    quality_score: number;
    drift_score: number;
    flags: string[];
    metrics: Record<string, number>;
  };
}

interface SignalJournalProps {
  workspaceMode?: 'RESEARCH' | 'REVIEW' | 'TRAINING';
}

const SignalJournal: React.FC<SignalJournalProps> = ({ workspaceMode = 'RESEARCH' }) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filteredSignals, setFilteredSignals] = useState<Signal[]>([]);
  const [personaEvaluations, setPersonaEvaluations] = useState<Record<string, any>>({});
  const [similarSignals, setSimilarSignals] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [failureTaxonomy, setFailureTaxonomy] = useState<any[]>([]);
  const [tempFailureTags, setTempFailureTags] = useState<string[]>([]);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const toast = useToast();
  
  // Filters
  const [filterStrategy, setFilterStrategy] = useState('all');
  const [filterRegime, setFilterRegime] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterPersona, setFilterPersona] = useState('all');
  const [filterSession, setFilterSession] = useState('all');

  const fetchJournal = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/journal');
      const data = await response.json();
      setSignals(data.reverse());
    } catch (error) {
      console.error('Failed to fetch journal:', error);
    }
  };

  const fetchFailureTaxonomy = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/taxonomy/failures');
      const data = await response.json();
      setFailureTaxonomy(data);
    } catch (error) {
      console.error('Failed to fetch taxonomy:', error);
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

  const fetchPersonaEvaluations = async () => {
    const personaIds = ['conservative_analyst', 'momentum_trader', 'contrarian_trader', 'risk_manager'];
    const evals: Record<string, any> = {};
    for (const pid of personaIds) {
      try {
        const response = await demoFetch(`http://localhost:8000/api/personas/evaluation/${pid}`);
        evals[pid] = await response.json();
      } catch (e) {
        console.error(`Failed to fetch eval for ${pid}`, e);
      }
    }
    setPersonaEvaluations(evals);
  };

  const fetchSimilarSignals = async (signalId: string) => {
    try {
      const response = await demoFetch(`http://localhost:8000/api/journal/similar/${signalId}`);
      const data = await response.json();
      setSimilarSignals(data);
    } catch (error) {
      console.error('Failed to fetch similar signals:', error);
    }
  };

  useEffect(() => {
    fetchJournal();
    fetchPersonaEvaluations();
    fetchSessions();
    fetchFailureTaxonomy();
    const interval = setInterval(() => {
      fetchJournal();
      fetchSessions();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = [...signals];
    if (filterStrategy !== 'all') {
      filtered = filtered.filter(s => s.strategy_name === filterStrategy);
    }
    if (filterRegime !== 'all') {
      filtered = filtered.filter(s => s.market_regime === filterRegime);
    }
    if (filterAction !== 'all') {
      filtered = filtered.filter(s => s.action === filterAction);
    }
    if (filterPersona !== 'all') {
      filtered = filtered.filter(s => s.persona_id === filterPersona);
    }
    if (filterSession !== 'all') {
      filtered = filtered.filter(s => s.session_id === filterSession);
    }
    setFilteredSignals(filtered);
  }, [signals, filterStrategy, filterRegime, filterAction, filterPersona, filterSession]);

  const handleBookmark = async (signalId: string) => {
    try {
      const response = await demoFetch(`http://localhost:8000/api/journal/bookmark/${signalId}`, { method: 'POST' });
      const data = await response.json();
      if (data.status === 'success') {
        toast({ title: 'Signal Bookmarked', status: 'success', duration: 2000 });
      } else {
        toast({ title: 'Already bookmarked or no active session', status: 'info', duration: 2000 });
      }
    } catch (error) {
      toast({ title: 'Bookmarking failed', status: 'error' });
    }
  };

  const handleOpenDetail = (signal: Signal | any) => {
    setSelectedSignal(signal);
    setTempNotes(signal.notes || '');
    setTempFailureTags(signal.tags || []);
    setSimilarSignals([]);
    fetchSimilarSignals(signal.id);
    onOpen();
  };

  const toggleFailureTag = (tagId: string) => {
    if (tempFailureTags.includes(tagId)) {
      setTempFailureTags(tempFailureTags.filter(t => t !== tagId));
    } else {
      setTempFailureTags([...tempFailureTags, tagId]);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedSignal) return;
    try {
      await demoFetch('http://localhost:8000/api/journal/annotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: selectedSignal.timestamp,
          notes: tempNotes,
          tags: tempFailureTags,
        }),
      });
      fetchJournal();
      toast({ title: 'Annotation saved', status: 'success', duration: 2000 });
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  };

  const handleShowOnChart = (signal: Signal) => {
    const event = new CustomEvent('focus-chart', {
      detail: { timestamp: new Date(signal.timestamp).getTime() }
    });
    window.dispatchEvent(event);
  };

  const handleClearJournal = async () => {
    if (window.confirm('Are you sure you want to clear the journal?')) {
      try {
        await demoFetch('http://localhost:8000/api/journal/clear', { method: 'POST' });
        setSignals([]);
      } catch (error) {
        console.error('Failed to clear journal:', error);
      }
    }
  };

  const getRegimeColor = (regime?: string) => {
    switch(regime) {
      case 'trending': return 'blue';
      case 'volatile': return 'orange';
      case 'sideways': return 'purple';
      default: return 'gray';
    }
  };

  const getRegimeHint = (regime?: string) => {
    switch(regime) {
      case 'trending': return 'Price is moving strongly in one direction. Good for momentum followers.';
      case 'volatile': return 'Price is jumping unpredictably. High risk for both long and short.';
      case 'sideways': return 'Price is trapped in a narrow range. Reversion strategies usually win here.';
      default: return 'Stable market conditions.';
    }
  };

  const handleStartChallenge = () => {
    if (signals.length === 0) return;
    const randomIdx = Math.floor(Math.random() * signals.length);
    const signal = signals[randomIdx];
    handleShowOnChart(signal);
    toast({
        title: 'Analytical Challenge Started',
        description: 'Review the chart context and AI reasoning for this moment.',
        status: 'info',
        duration: 4000
    });
  };

  const getActionHint = (action: string) => {
    return action === 'buy' ? 'Entering a long position expecting price growth.' : 
           action === 'sell' ? 'Exiting a position or shorting expecting price drop.' : 
           'Staying on the sidelines as indicators are unclear.';
  };

  const brandColor = 'brand.500';

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <HStack justifyContent="space-between" mb={4}>
        <HStack spacing={3}>
            <Text fontSize="md" fontWeight="bold" letterSpacing="tight">Decision Journal</Text>
            <Badge colorScheme={workspaceMode === 'RESEARCH' ? 'brand' : workspaceMode === 'REVIEW' ? 'pink' : 'green'} fontSize="10px" variant="outline">
                {workspaceMode} MODE
            </Badge>
            {workspaceMode === 'TRAINING' && (
                <Button 
                    size="xs" 
                    colorScheme="green" 
                    leftIcon={<RepeatIcon />} 
                    onClick={handleStartChallenge}
                    fontSize="9px"
                >
                    Take Replay Challenge
                </Button>
            )}
        </HStack>
        <Button size="xs" colorScheme="red" variant="ghost" onClick={handleClearJournal}>
          Clear
        </Button>
      </HStack>

      <HStack spacing={2} mb={4} overflowX="auto" pb={2}>
        <Select size="xs" w="100px" bg="background.deep" borderColor="ui.border" value={filterStrategy} onChange={(e) => setFilterStrategy(e.target.value)}>
          <option value="all">All Strat</option>
          <option value="price_change">Price Chg</option>
          <option value="rsi_ma">RSI+MA</option>
          <option value="combined">Combined</option>
        </Select>
        <Select size="xs" w="100px" bg="background.deep" borderColor="ui.border" value={filterRegime} onChange={(e) => setFilterRegime(e.target.value)}>
          <option value="all">All Regime</option>
          <option value="trending">Trending</option>
          <option value="sideways">Sideways</option>
          <option value="volatile">Volatile</option>
        </Select>
        <Select size="xs" w="100px" bg="background.deep" borderColor="ui.border" value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
          <option value="all">All Action</option>
          <option value="buy">BUY</option>
          <option value="sell">SELL</option>
          <option value="hold">HOLD</option>
        </Select>
        <Select size="xs" w="100px" bg="background.deep" borderColor="ui.border" value={filterPersona} onChange={(e) => setFilterPersona(e.target.value)}>
          <option value="all">All Persona</option>
          <option value="conservative_analyst">Conservative</option>
          <option value="momentum_trader">Momentum</option>
          <option value="contrarian_trader">Contrarian</option>
          <option value="risk_manager">Risk Mgr</option>
          <option value="default">Default</option>
        </Select>
        <Select size="xs" w="120px" bg="background.deep" borderColor="ui.border" value={filterSession} onChange={(e) => setFilterSession(e.target.value)}>
          <option value="all">All Sessions</option>
          {(sessions || []).map(s => (
            <option key={s.session_id} value={s.session_id}>{s.title}</option>
          ))}
        </Select>
      </HStack>
      
      <Box overflowY="auto" maxH="400px" pr={1} sx={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { bg: 'whiteAlpha.100', borderRadius: 'full' } }}>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr borderBottom="1px" borderColor="ui.border">
              <Th fontSize="9px" color="ui.muted">TIMESTAMP</Th>
              <Th fontSize="9px" color="ui.muted">PERSONA</Th>
              <Th fontSize="9px" color="ui.muted">ACTION</Th>
              <Th fontSize="9px" color="ui.muted">REGIME</Th>
              <Th isNumeric fontSize="9px" color="ui.muted">PRICE</Th>
              <Th fontSize="9px" color="ui.muted">OUTCOME</Th>
              <Th fontSize="9px" color="ui.muted">OPS</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredSignals.length === 0 ? (
                <Tr>
                    <Td colSpan={7} py={12} textAlign="center">
                        <VStack spacing={2} opacity={0.6}>
                            <Icon as={SearchIcon} w={5} h={5} color="ui.muted" />
                            <Text fontSize="xs" color="ui.muted" fontStyle="italic">No signals detected in the current analytical stream.</Text>
                        </VStack>
                    </Td>
                </Tr>
            ) : (filteredSignals || []).map((signal, index) => (
              <Popover key={index} trigger="hover" placement="right" openDelay={500}>
                <PopoverTrigger>
                    <Tr _hover={{ bg: "whiteAlpha.50" }} borderLeft={signal.notes ? "2px solid" : "none"} borderColor="brand.500" cursor="help">
                        <Td fontSize="11px" color="ui.muted" py={2}>{new Date(signal.timestamp).toLocaleTimeString()}</Td>
                        <Td py={2}>
                        {signal.persona_id && (
                            <Badge colorScheme="purple" fontSize="9px" variant="solid" bg="purple.900" color="purple.100" borderRadius="xs">
                            {(signal.persona_id || 'unknown').split('_')[0]}
                            </Badge>
                        )}
                        </Td>
                        <Td py={2}>
                        <Tooltip label={workspaceMode === 'TRAINING' ? getActionHint(signal.action) : ''}>
                            <Badge colorScheme={signal.action === 'buy' ? 'green' : signal.action === 'sell' ? 'red' : 'gray'} fontSize="9px" borderRadius="xs">
                                {(signal.action || 'unknown').toUpperCase()}
                                {workspaceMode === 'TRAINING' && <QuestionOutlineIcon ml={1} w={2} h={2} />}
                            </Badge>
                        </Tooltip>
                        </Td>
                        <Td py={2}>
                        <Tooltip label={workspaceMode === 'TRAINING' ? getRegimeHint(signal.market_regime) : ''}>
                            <Badge colorScheme={getRegimeColor(signal.market_regime)} variant="outline" fontSize="9px" borderRadius="xs">
                                {signal.market_regime || 'unknown'}
                                {workspaceMode === 'TRAINING' && <InfoIcon ml={1} w={2} h={2} />}
                            </Badge>
                        </Tooltip>
                        </Td>
                        <Td isNumeric fontSize="11px" fontWeight="500" py={2}>{(signal.price || 0).toLocaleString()}</Td>
                        <Td fontSize="11px" py={2}>
                        {signal.outcomes?.['5m'] ? (
                            <Text color={signal.outcomes['5m'].pct >= 0 ? "green.300" : "red.300"} fontWeight="bold">
                            {signal.outcomes['5m'].pct > 0 ? '+' : ''}{signal.outcomes['5m'].pct}%
                            </Text>
                        ) : (
                            <Text color="ui.muted">---</Text>
                        )}
                        </Td>
                        <Td py={2}>
                        <HStack spacing={1}>
                            {!signal.indicators_snapshot && (
                            <Tooltip label="Missing indicators snapshot (breaks replay)">
                                <Icon as={WarningIcon} color="orange.400" w={3} h={3} />
                            </Tooltip>
                            )}
                            <IconButton 
                            size="xs" 
                            variant="ghost"
                            aria-label="View Detail" 
                            icon={<ViewIcon w={3} h={3} />} 
                            onClick={() => handleOpenDetail(signal)} 
                            />
                            <IconButton 
                            size="xs" 
                            variant="ghost"
                            aria-label="Bookmark" 
                            color={signal.notes ? "brand.500" : "ui.muted"}
                            icon={<StarIcon w={3} h={3} />} 
                            onClick={() => handleBookmark(signal.id)} 
                            />
                            <IconButton 
                            size="xs" 
                            variant="ghost"
                            aria-label="Show on Chart" 
                            icon={<SearchIcon w={3} h={3} />} 
                            onClick={() => handleShowOnChart(signal)} 
                            />
                        </HStack>
                        </Td>
                    </Tr>
                </PopoverTrigger>
                <PopoverContent bg="background.surface" borderColor="ui.border" boxShadow="panel" p={3} w="280px" borderRadius="md">
                    <PopoverArrow bg="background.surface" />
                    <PopoverHeader border="none" p={0} mb={2}>
                        <HStack justify="space-between">
                            <Text fontSize="10px" fontWeight="800" color="brand.500" letterSpacing="widest">REASONING PREVIEW</Text>
                            <Badge fontSize="8px" borderRadius="xs">{signal.strategy_name}</Badge>
                        </HStack>
                    </PopoverHeader>
                    <PopoverBody p={0}>
                        <Text fontSize="11px" fontStyle="italic" color="gray.300" noOfLines={3} mb={3} lineHeight="tall">
                            "{signal.reasoning_trace || signal.reason}"
                        </Text>
                        {signal.evaluation && (
                            <HStack>
                                <Text fontSize="9px" color="ui.muted">Confidence:</Text>
                                <Progress value={signal.evaluation.quality_score * 100} size="2xs" flex={1} colorScheme="brand" bg="whiteAlpha.100" borderRadius="full" />
                                <Text fontSize="9px" fontWeight="bold">{Math.round(signal.evaluation.quality_score * 100)}%</Text>
                            </HStack>
                        )}
                    </PopoverBody>
                </PopoverContent>
              </Popover>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="background.surface" color="white" borderWidth="1px" borderColor="ui.border" borderRadius="xl">
          <ModalHeader fontSize="md" fontWeight="bold" letterSpacing="tight" borderBottomWidth="1px" borderColor="ui.border">
            {workspaceMode === 'TRAINING' ? 'Guided Reasoning Review' : 'Outcome Intelligence Report'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            {selectedSignal && (
              <VStack align="stretch" spacing={6}>
                {workspaceMode === 'TRAINING' && (
                    <Box p={3} bg="brand.900" borderRadius="md" borderLeft="4px solid" borderColor="brand.500">
                        <Text fontSize="xs" fontWeight="bold" color="brand.200" mb={1}>TRAINING HINT</Text>
                        <Text fontSize="xs" color="brand.50">
                            This persona is acting in a <b>{selectedSignal.market_regime}</b> regime. 
                            {getRegimeHint(selectedSignal.market_regime)}
                        </Text>
                    </Box>
                )}

                <HStack justifyContent="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold" fontSize="md">{selectedSignal.symbol}</Text>
                    <Text fontSize="xs" color="ui.muted">{selectedSignal.timestamp}</Text>
                  </VStack>
                  <HStack>
                    <Badge colorScheme="blue" variant="subtle">{selectedSignal.strategy_name}</Badge>
                    <Badge colorScheme={getRegimeColor(selectedSignal.market_regime)} variant="outline">{selectedSignal.market_regime}</Badge>
                    <Badge colorScheme={selectedSignal.action === 'buy' ? 'green' : 'red'} variant="solid">
                      {(selectedSignal.action || 'unknown').toUpperCase()}
                    </Badge>
                  </HStack>
                </HStack>
                
                <SimpleGrid columns={2} spacing={4}>
                    <Box bg="blackAlpha.300" p={3} borderRadius="md" borderWidth="1px" borderColor="ui.border">
                    <Text fontWeight="bold" fontSize="10px" mb={2} color="ui.muted">REASONING QUALITY</Text>
                    {selectedSignal.evaluation ? (
                        <VStack align="start" spacing={2}>
                        <HStack justifyContent="space-between" w="100%">
                            <Text fontSize="xs">Quality:</Text>
                            <Badge variant="solid" colorScheme={selectedSignal.evaluation.quality_score > 0.7 ? "green" : "orange"} fontSize="10px">
                                {Math.round(selectedSignal.evaluation.quality_score * 100)}%
                            </Badge>
                        </HStack>
                        <HStack wrap="wrap">
                            {(selectedSignal.evaluation?.flags || []).map(flag => (
                            <Badge key={flag} colorScheme="red" variant="outline" fontSize="9px">{flag}</Badge>
                            ))}
                        </HStack>
                        </VStack>
                    ) : (
                        <Text fontSize="xs" color="ui.muted">No metadata</Text>
                    )}
                    </Box>

                    <Box bg="blackAlpha.300" p={3} borderRadius="md" borderWidth="1px" borderColor="ui.border">
                    <Text fontWeight="bold" fontSize="10px" mb={2} color="ui.muted">OUTCOME TRACKING</Text>
                    <HStack spacing={3} justifyContent="space-around">
                        {['5m', '15m', '1h'].map(interval => (
                        <VStack key={interval} spacing={0}>
                            <Text fontSize="9px" color="ui.muted">{interval.toUpperCase()}</Text>
                            <Text fontSize="xs" fontWeight="bold" color={selectedSignal.outcomes?.[interval] ? (selectedSignal.outcomes[interval].pct >= 0 ? "green.300" : "red.300") : "whiteAlpha.300"}>
                            {selectedSignal.outcomes?.[interval] ? `${selectedSignal.outcomes[interval].pct}%` : '---'}
                            </Text>
                        </VStack>
                        ))}
                    </HStack>
                    </Box>
                </SimpleGrid>

                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="ui.muted" mb={2} textTransform="uppercase">Reasoning Trace</Text>
                  <Text bg="blackAlpha.400" p={3} borderRadius="md" fontSize="xs" fontStyle="italic" color="blue.100" borderLeft="2px solid" borderColor="blue.500">
                    {selectedSignal.reasoning_trace || 'No detailed trace available.'}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="ui.muted" mb={2} textTransform="uppercase">Indicator Logic</Text>
                  <Text bg="blackAlpha.200" p={3} borderRadius="md" fontSize="xs" color="gray.200">
                    {selectedSignal.reason}
                  </Text>
                </Box>

                {workspaceMode !== 'TRAINING' && similarSignals.length > 0 && (
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="ui.muted" mb={2} textTransform="uppercase">Similar Historical Cases</Text>
                    <VStack align="stretch" spacing={2}>
                      {(similarSignals || []).map((s: any) => (
                        <Box key={s.id} bg="blackAlpha.200" p={2} borderRadius="md" borderLeft="3px solid" borderColor="brand.500">
                          <HStack justifyContent="space-between">
                            <Text fontSize="10px" color="ui.muted">{new Date(s.timestamp).toLocaleDateString()} ({s.persona_id})</Text>
                            <Badge colorScheme="brand" variant="outline" fontSize="9px">{Math.round(s.similarity * 100)}% Match</Badge>
                          </HStack>
                          <Text fontSize="10px" noOfLines={1} mt={1} fontStyle="italic" color="gray.400">{s.reasoning_trace}</Text>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}

                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="ui.muted" mb={2} textTransform="uppercase">Human Audit & Tags</Text>
                  <HStack wrap="wrap" spacing={2} mb={3}>
                    {(failureTaxonomy || []).map(f => (
                      <Badge 
                        key={f.id} 
                        cursor="pointer"
                        variant={tempFailureTags.includes(f.id) ? "solid" : "outline"}
                        colorScheme="red"
                        fontSize="9px"
                        onClick={() => toggleFailureTag(f.id)}
                      >
                        {f.label}
                      </Badge>
                    ))}
                  </HStack>
                  <Textarea 
                    value={tempNotes} 
                    onChange={(e) => setTempNotes(e.target.value)}
                    placeholder="Record post-mortem observations here..."
                    size="sm"
                    fontSize="xs"
                    bg="blackAlpha.300"
                    borderColor="ui.border"
                    _focus={{ borderColor: brandColor }}
                  />
                  <Button size="xs" mt={3} colorScheme="brand" onClick={handleSaveNotes} w="100%">
                    Save Qualitative Audit
                  </Button>
                </Box>

                {/* Collaborative Research Commentary Layer */}
                <ResearchCommentary signal_id={selectedSignal.id} />

                {/* Research Reflections / Critique Layer */}
                <Box p={3} bg="blue.900" borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
                    <Text fontSize="10px" fontWeight="800" color="blue.100" mb={1}>RESEARCH REFLECTION PROMPTS</Text>
                    <VStack align="stretch" spacing={1}>
                        <Text fontSize="xs" color="blue.50">• How does this reasoning differ from previous {selectedSignal.market_regime} cases?</Text>
                        <Text fontSize="xs" color="blue.50">• Did the indicators show early divergence before the {selectedSignal.action} signal?</Text>
                        <Text fontSize="xs" color="blue.50">• Is the confidence justified by the historical win-rate for {selectedSignal.persona_id}?</Text>
                    </VStack>
                </Box>

                {workspaceMode === 'RESEARCH' && (
                    <Box>
                        <Text fontSize="xs" fontWeight="bold" color="ui.muted" mb={2} textTransform="uppercase">Raw Indicators Snapshot</Text>
                        <Code p={3} borderRadius="md" w="100%" bg="blackAlpha.500" color="brand.200" fontSize="10px">
                            <pre style={{ overflow: 'auto', maxHeight: '100px' }}>{JSON.stringify(selectedSignal.indicators_snapshot, null, 2)}</pre>
                        </Code>
                    </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="ui.border">
            <Button size="sm" variant="ghost" onClick={onClose}>
              Close Report
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SignalJournal;
