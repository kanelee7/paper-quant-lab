import React, { useState, useEffect, useCallback } from 'react';
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
} from '@chakra-ui/react';
import {
  ViewIcon,
  SearchIcon,
  StarIcon,
  QuestionOutlineIcon,
  WarningIcon,
  InfoIcon,
} from '@chakra-ui/icons';
import { demoFetch } from "../demo/demoFetch";
import { API_BASE_URL } from '../config/api';
import { useI18n } from '../i18n';
import ResearchCommentary from './ResearchCommentary';

interface Signal {
  id: string;
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
  verified?: boolean;
  last_audit?: string;
  review_note?: string;
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
  const { t } = useI18n();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filteredSignals, setFilteredSignals] = useState<Signal[]>([]);
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

  const fetchJournal = useCallback(async () => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/journal`);
      const data = await response.json();
      setSignals(data);
    } catch (error) {
      console.error('Failed to fetch journal:', error);
    }
  }, []);

  const fetchFailureTaxonomy = useCallback(async () => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/taxonomy/failures`);
      const data = await response.json();
      setFailureTaxonomy(data);
    } catch (error) {
      console.error('Failed to fetch taxonomy:', error);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/sessions`);
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  }, []);

  const fetchSimilarSignals = useCallback(async (signalId: string) => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/journal/similar/${signalId}`);
      const data = await response.json();
      setSimilarSignals(data);
    } catch (error) {
      console.error('Failed to fetch similar signals:', error);
    }
  }, []);

  const handleOpenDetail = useCallback((signal: Signal | any) => {
    setSelectedSignal(signal);
    setTempNotes(signal.notes || '');
    setTempFailureTags(signal.tags || []);
    setSimilarSignals([]);
    fetchSimilarSignals(signal.id);
    onOpen();
  }, [onOpen, fetchSimilarSignals]);

  useEffect(() => {
    fetchJournal();
    fetchSessions();
    fetchFailureTaxonomy();

    const handleOpenDetailEvent = (e: any) => {
        const signalId = e.detail?.signalId;
        if (signalId) {
            const signal = signals.find(s => s.id === signalId);
            if (signal) {
                handleOpenDetail(signal);
            } else {
                fetchJournal().then(() => {
                    const refreshedSignal = signals.find(s => s.id === signalId);
                    if (refreshedSignal) handleOpenDetail(refreshedSignal);
                });
            }
        }
    };

    window.addEventListener('open-signal-detail', handleOpenDetailEvent);

    const interval = setInterval(() => {
      fetchJournal();
      fetchSessions();
    }, 5000);
    return () => {
        clearInterval(interval);
        window.removeEventListener('open-signal-detail', handleOpenDetailEvent);
    };
  }, [signals, handleOpenDetail, fetchJournal, fetchSessions, fetchFailureTaxonomy]);

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
      const response = await demoFetch(`${API_BASE_URL}/api/journal/bookmark/${signalId}`, { method: 'POST' });
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
      await demoFetch(`${API_BASE_URL}/api/journal/annotate`, {
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
        await demoFetch(`${API_BASE_URL}/api/journal/clear`, { method: 'POST' });
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

  const getActionHint = (action: string) => {
    return action === 'buy' ? 'Entering a long position expecting price growth.' : 
           action === 'sell' ? 'Exiting a position or shorting expecting price drop.' : 
           'Staying on the sidelines as indicators are unclear.';
  };

  const brandColor = 'brand.500';

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <HStack justifyContent="space-between" mb={4}>
        <VStack align="start" spacing={0}>
            <Text fontSize="10px" fontWeight="900" color="brand.500" letterSpacing="widest">{t('label.signals')}</Text>
            <Text fontSize="9px" color="ui.muted">{t('label.trace_repository')}</Text>
        </VStack>
        <HStack spacing={2}>
            <Badge colorScheme={workspaceMode === 'RESEARCH' ? 'brand' : workspaceMode === 'REVIEW' ? 'pink' : 'green'} fontSize="9px" variant="outline" px={2} borderRadius="xs">
                {workspaceMode === 'RESEARCH' ? t('nav.research') : workspaceMode === 'REVIEW' ? t('nav.review') : t('nav.training')}
            </Badge>
            <Button size="xs" colorScheme="red" variant="ghost" onClick={handleClearJournal} fontSize="9px" borderRadius="xs">
            {t('btn.clear')}
            </Button>
        </HStack>
      </HStack>

      <HStack spacing={2} mb={4} overflowX="auto" pb={2}>
        <Select size="xs" w="100px" bg="background.deep" borderColor="ui.border" value={filterStrategy} onChange={(e) => setFilterStrategy(e.target.value)} borderRadius="xs">
          <option value="all">All Strat</option>
          <option value="price_change">Price Chg</option>
          <option value="rsi_ma">RSI+MA</option>
          <option value="combined">Combined</option>
        </Select>
        <Select size="xs" w="100px" bg="background.deep" borderColor="ui.border" value={filterRegime} onChange={(e) => setFilterRegime(e.target.value)} borderRadius="xs">
          <option value="all">All Regime</option>
          <option value="trending">Trending</option>
          <option value="sideways">Sideways</option>
          <option value="volatile">Volatile</option>
        </Select>
        <Select size="xs" w="100px" bg="background.deep" borderColor="ui.border" value={filterAction} onChange={(e) => setFilterAction(e.target.value)} borderRadius="xs">
          <option value="all">All Action</option>
          <option value="buy">BUY</option>
          <option value="sell">SELL</option>
          <option value="hold">HOLD</option>
        </Select>
        <Select size="xs" w="100px" bg="background.deep" borderColor="ui.border" value={filterPersona} onChange={(e) => setFilterPersona(e.target.value)} borderRadius="xs">
          <option value="all">All Persona</option>
          <option value="conservative_analyst">Conservative</option>
          <option value="momentum_trader">Momentum</option>
          <option value="contrarian_trader">Contrarian</option>
          <option value="risk_manager">Risk Mgr</option>
        </Select>
        <Select size="xs" w="120px" bg="background.deep" borderColor="ui.border" value={filterSession} onChange={(e) => setFilterSession(e.target.value)} borderRadius="xs">
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
              <Th fontSize="9px" color="ui.muted" py={3}>TIME</Th>
              <Th fontSize="9px" color="ui.muted" py={3}>PERSONA</Th>
              <Th fontSize="9px" color="ui.muted" py={3}>ACTION</Th>
              <Th fontSize="9px" color="ui.muted" py={3}>REGIME</Th>
              <Th isNumeric fontSize="9px" color="ui.muted" py={3}>PRICE</Th>
              <Th fontSize="9px" color="ui.muted" py={3}>OUTCOME</Th>
              <Th fontSize="9px" color="ui.muted" py={3}>INSPECT</Th>
            </Tr>
          </Thead>
          <Tbody>
            {(!Array.isArray(filteredSignals) || filteredSignals.length === 0) ? (
                <Tr>
                    <Td colSpan={7} py={16} textAlign="center">
                        <VStack spacing={3}>
                            <Icon as={SearchIcon} w={6} h={6} color="ui.muted" opacity={0.4} />
                            <VStack spacing={1}>
                                <Text fontSize="xs" color="gray.300" fontWeight="800" letterSpacing="widest">NO SIGNALS</Text>
                                <Text fontSize="10px" color="ui.muted" maxW="280px" lineHeight="tall">
                                    {t('empty.no_signals')}
                                </Text>
                            </VStack>
                        </VStack>
                    </Td>
                </Tr>
            ) : (filteredSignals || []).map((signal, index) => {
              const isStale = (Date.now() - new Date(signal.timestamp).getTime()) > 86400000; // > 24h
              return (
              <Popover key={index} trigger="hover" placement="right" openDelay={500}>
                <PopoverTrigger>
                    <Tr _hover={{ bg: "whiteAlpha.50" }} borderLeft={signal.notes ? "2px solid" : "none"} borderColor="brand.500" cursor="help" opacity={isStale ? 0.6 : 1}>
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
                            {!signal.verified && (
                                <Tooltip label="Unresolved: Needs human verification">
                                    <Icon as={WarningIcon} color="orange.400" w={3} h={3} />
                                </Tooltip>
                            )}
                            {signal.review_note && (
                                <Tooltip label="Contains reviewer notes/critique">
                                    <Icon as={InfoIcon} color="blue.400" w={3} h={3} />
                                </Tooltip>
                            )}
                            {signal.evaluation && (
                                <Badge variant="outline" fontSize="7px" colorScheme={signal.evaluation.quality_score > 0.7 ? "green" : signal.evaluation.quality_score > 0.4 ? "orange" : "red"} px={1}>
                                    {Math.round(signal.evaluation.quality_score * 100)}% Q
                                </Badge>
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
            )})}
          </Tbody>
        </Table>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="background.surface" color="white" borderWidth="1px" borderColor="ui.border" borderRadius="xl">
          <ModalHeader fontSize="md" fontWeight="bold" letterSpacing="tight" borderBottomWidth="1px" borderColor="ui.border">
            {workspaceMode === 'REVIEW' ? t('label.analysis_report') : t('label.analysis_report')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            {selectedSignal && (
              <VStack align="stretch" spacing={6}>
                {selectedSignal.verified === false && (
                    <Box p={3} bg="orange.900" borderRadius="md" borderLeft="4px solid" borderColor="orange.500">
                        <HStack justifyContent="space-between">
                            <VStack align="start" spacing={0}>
                                <Text fontSize="xs" fontWeight="bold" color="orange.200">VERIFICATION PENDING</Text>
                                <Text fontSize="10px" color="orange.100">Trace requires human audit before knowledge synthesis.</Text>
                            </VStack>
                            <Badge colorScheme="orange" variant="solid">AWAITING</Badge>
                        </HStack>
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
                    <Text fontWeight="bold" fontSize="10px" mb={2} color="ui.muted">{t('label.quality')}</Text>
                    {selectedSignal.evaluation ? (
                        <VStack align="start" spacing={2}>
                        <HStack justifyContent="space-between" w="100%">
                            <Text fontSize="xs">Score:</Text>
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
                    <Text fontWeight="bold" fontSize="10px" mb={2} color="ui.muted">{t('label.outcomes')}</Text>
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
                  <Text fontSize="xs" fontWeight="bold" color="ui.muted" mb={2} textTransform="uppercase">{t('label.trace')}</Text>
                  <Text bg="blackAlpha.400" p={3} borderRadius="md" fontSize="xs" fontStyle="italic" color="blue.100" borderLeft="2px solid" borderColor="blue.500">
                    {selectedSignal.reasoning_trace || 'No detailed trace available.'}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="ui.muted" mb={2} textTransform="uppercase">{t('label.logic')}</Text>
                  <Text bg="blackAlpha.200" p={3} borderRadius="md" fontSize="xs" color="gray.200">
                    {selectedSignal.reason}
                  </Text>
                </Box>

                {workspaceMode !== 'TRAINING' && (similarSignals || []).length > 0 && (
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="ui.muted" mb={2} textTransform="uppercase">{t('label.related_records')}</Text>
                    <VStack align="stretch" spacing={2}>
                      {(similarSignals || []).map((s: any) => (
                        <Box key={s.id} bg="blackAlpha.200" p={2} borderRadius="md" borderLeft="3px solid" borderColor="brand.500">
                          <HStack justifyContent="space-between">
                            <Text fontSize="10px" color="ui.muted">{new Date(s.timestamp).toLocaleDateString()} ({s.persona_id})</Text>
                            <Badge colorScheme="brand" variant="outline" fontSize="9px">{Math.round((s.similarity || 0) * 100)}% Match</Badge>
                          </HStack>
                          <Text fontSize="10px" noOfLines={1} mt={1} fontStyle="italic" color="gray.400">{s.reasoning_trace || s.reason}</Text>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}

                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="ui.muted" mb={2} textTransform="uppercase">{t('label.notes_audit')}</Text>
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
                    placeholder="Record post-mortem observations or verify logical traces..."
                    size="sm"
                    fontSize="xs"
                    bg="blackAlpha.300"
                    borderColor="ui.border"
                    _focus={{ borderColor: brandColor }}
                  />
                  <HStack mt={3} spacing={3}>
                    <Button size="xs" colorScheme="brand" onClick={handleSaveNotes} flex={1} fontSize="10px">
                        {t('btn.save')}
                    </Button>
                    {!selectedSignal.verified && (
                        <Button size="xs" colorScheme="green" variant="outline" flex={1} fontSize="10px">
                            {t('btn.verify')}
                        </Button>
                    )}
                  </HStack>
                </Box>

                <ResearchCommentary signal_id={selectedSignal.id} />

                {/* Related Findings Section */}
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="ui.muted" mb={2} textTransform="uppercase">{t('label.related_records')}</Text>
                  <VStack align="stretch" spacing={2}>
                    {(() => {
                        try {
                            const raw = localStorage.getItem('pql_research_findings');
                            const findings = JSON.parse(raw || '[]');
                            const list = Array.isArray(findings) ? findings : [];
                            const related = list.filter(f => 
                                (Array.isArray(f.evidence_ids) && f.evidence_ids.includes(selectedSignal.id)) || 
                                (Array.isArray(f.tags) && f.tags.some((t: string) => (selectedSignal.tags || []).includes(t))) ||
                                (Array.isArray(f.tags) && f.tags.some((t: string) => (selectedSignal.market_regime === t)))
                            );

                            if (related.length === 0) return <Text fontSize="10px" color="ui.muted" fontStyle="italic">No linked findings found.</Text>;

                            return related.slice(0, 3).map(f => (
                                <Box key={f.id} p={2} bg="brand.900" borderRadius="md" borderLeft="3px solid" borderColor="brand.500">
                                    <HStack justify="space-between">
                                        <Text fontSize="10px" fontWeight="bold" color="brand.100">{f.title || 'Untitled Finding'}</Text>
                                        <Badge fontSize="8px" colorScheme={f.status === 'stale' ? 'orange' : 'brand'}>{(f.status || 'ACTIVE').toUpperCase()}</Badge>
                                    </HStack>
                                    <Text fontSize="10px" color="brand.200" noOfLines={1} mt={1}>{f.observation || 'No observation recorded.'}</Text>
                                </Box>
                            ));
                        } catch (e) {
                            return <Text fontSize="10px" color="ui.muted" fontStyle="italic">Unable to load related findings.</Text>;
                        }
                    })()}
                  </VStack>
                </Box>

                <Box p={3} bg="blue.900" borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
                    <Text fontSize="10px" fontWeight="800" color="blue.100" mb={1}>{t('label.reflections')}</Text>
                    <VStack align="stretch" spacing={1}>
                        <Text fontSize="xs" color="blue.50">• Is the reasoning trace consistent with the recorded {selectedSignal.market_regime} indicators?</Text>
                        <Text fontSize="xs" color="blue.50">• Did the {selectedSignal.persona_id} exhibit analytical drift compared to v1.1 sessions?</Text>
                    </VStack>
                </Box>

              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="ui.border">
            <Button size="sm" variant="ghost" onClick={onClose}>
              {t('btn.close')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SignalJournal;
