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
} from '@chakra-ui/react';
import { ViewIcon, SearchIcon } from '@chakra-ui/icons';

interface Signal {
  id: string;
  timestamp: string;
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  price: number;
  strategy_name: string;
  reason: string;
  market_regime?: string;
  outcomes?: Record<string, { pct: number; price_delta: number }>;
  indicators_snapshot: any;
  order_id?: string;
  notes?: string;
}

const SignalJournal: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filteredSignals, setFilteredSignals] = useState<Signal[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  
  // Filters
  const [filterStrategy, setFilterStrategy] = useState('all');
  const [filterRegime, setFilterRegime] = useState('all');
  const [filterAction, setFilterAction] = useState('all');

  const fetchJournal = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/journal');
      const data = await response.json();
      setSignals(data.reverse());
    } catch (error) {
      console.error('Failed to fetch journal:', error);
    }
  };

  useEffect(() => {
    fetchJournal();
    const interval = setInterval(fetchJournal, 5000);
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
    setFilteredSignals(filtered);
  }, [signals, filterStrategy, filterRegime, filterAction]);

  const handleOpenDetail = (signal: Signal) => {
    setSelectedSignal(signal);
    setTempNotes(signal.notes || '');
    onOpen();
  };

  const handleSaveNotes = async () => {
    if (!selectedSignal) return;
    try {
      await fetch('http://localhost:8000/api/journal/annotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: selectedSignal.timestamp,
          notes: tempNotes,
        }),
      });
      fetchJournal();
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
        await fetch('http://localhost:8000/api/journal/clear', { method: 'POST' });
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

  return (
    <Box bg="gray.800" borderRadius="lg" p={4} shadow="md">
      <HStack justifyContent="space-between" mb={4}>
        <Text fontSize="lg" fontWeight="bold">Decision Journal</Text>
        <Button size="xs" colorScheme="red" variant="outline" onClick={handleClearJournal}>
          Clear
        </Button>
      </HStack>

      {/* Filter Bar */}
      <HStack spacing={2} mb={4}>
        <Select size="xs" w="100px" bg="gray.700" value={filterStrategy} onChange={(e) => setFilterStrategy(e.target.value)}>
          <option value="all">All Strat</option>
          <option value="price_change">Price Chg</option>
          <option value="rsi_ma">RSI+MA</option>
          <option value="combined">Combined</option>
        </Select>
        <Select size="xs" w="100px" bg="gray.700" value={filterRegime} onChange={(e) => setFilterRegime(e.target.value)}>
          <option value="all">All Regime</option>
          <option value="trending">Trending</option>
          <option value="sideways">Sideways</option>
          <option value="volatile">Volatile</option>
        </Select>
        <Select size="xs" w="100px" bg="gray.700" value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
          <option value="all">All Action</option>
          <option value="buy">BUY</option>
          <option value="sell">SELL</option>
          <option value="hold">HOLD</option>
        </Select>
      </HStack>
      
      <Box overflowY="auto" maxH="400px">
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Time</Th>
              <Th>Action</Th>
              <Th>Regime</Th>
              <Th isNumeric>Price</Th>
              <Th>Outcome(5m)</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredSignals.map((signal, index) => (
              <Tr key={index} _hover={{ bg: "gray.700" }}>
                <Td fontSize="xs">{new Date(signal.timestamp).toLocaleTimeString()}</Td>
                <Td>
                  <Badge colorScheme={signal.action === 'buy' ? 'green' : signal.action === 'sell' ? 'red' : 'gray'}>
                    {signal.action.toUpperCase()}
                  </Badge>
                </Td>
                <Td>
                  <Badge colorScheme={getRegimeColor(signal.market_regime)} variant="outline" fontSize="2xs">
                    {signal.market_regime || 'unknown'}
                  </Badge>
                </Td>
                <Td isNumeric fontSize="xs">{signal.price.toLocaleString()}</Td>
                <Td fontSize="xs">
                  {signal.outcomes?.['5m'] ? (
                    <Text color={signal.outcomes['5m'].pct >= 0 ? "green.300" : "red.300"} fontWeight="bold">
                      {signal.outcomes['5m'].pct > 0 ? '+' : ''}{signal.outcomes['5m'].pct}%
                    </Text>
                  ) : (
                    <Text color="gray.500">...</Text>
                  )}
                </Td>
                <Td>
                  <HStack spacing={1}>
                    <IconButton 
                      size="xs" 
                      aria-label="View Detail" 
                      icon={<ViewIcon />} 
                      onClick={() => handleOpenDetail(signal)} 
                    />
                    <IconButton 
                      size="xs" 
                      aria-label="Show on Chart" 
                      icon={<SearchIcon />} 
                      onClick={() => handleShowOnChart(signal)} 
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Signal Analysis & Outcome Intelligence</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedSignal && (
              <VStack align="stretch" spacing={4}>
                <HStack justifyContent="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold" fontSize="sm">{selectedSignal.symbol}</Text>
                    <Text fontSize="xs" color="gray.400">{selectedSignal.timestamp}</Text>
                  </VStack>
                  <HStack>
                    <Badge colorScheme="blue">{selectedSignal.strategy_name}</Badge>
                    <Badge colorScheme={getRegimeColor(selectedSignal.market_regime)}>{selectedSignal.market_regime}</Badge>
                    <Badge colorScheme={selectedSignal.action === 'buy' ? 'green' : 'red'}>
                      {selectedSignal.action.toUpperCase()}
                    </Badge>
                  </HStack>
                </HStack>
                
                <Box bg="gray.900" p={3} borderRadius="md">
                  <Text fontWeight="bold" fontSize="xs" mb={2} color="gray.400">OUTCOME TRACKING</Text>
                  <HStack spacing={4} justifyContent="space-around">
                    {['5m', '15m', '1h', '1d'].map(interval => (
                      <VStack key={interval} spacing={0}>
                        <Text fontSize="2xs" color="gray.500">{interval.toUpperCase()}</Text>
                        <Text fontWeight="bold" color={selectedSignal.outcomes?.[interval] ? (selectedSignal.outcomes[interval].pct >= 0 ? "green.400" : "red.400") : "gray.600"}>
                          {selectedSignal.outcomes?.[interval] ? `${selectedSignal.outcomes[interval].pct > 0 ? '+' : ''}${selectedSignal.outcomes[interval].pct}%` : '---'}
                        </Text>
                      </VStack>
                    ))}
                  </HStack>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={1}>Reasoning:</Text>
                  <Text bg="gray.900" p={2} borderRadius="md" fontSize="sm">{selectedSignal.reason}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={1}>Post-Mortem Notes:</Text>
                  <Textarea 
                    value={tempNotes} 
                    onChange={(e) => setTempNotes(e.target.value)}
                    placeholder="Why was this a good/bad entry? What did the indicators miss?"
                    size="sm"
                    bg="gray.900"
                  />
                  <Button size="xs" mt={2} colorScheme="blue" onClick={handleSaveNotes}>
                    Save Annotation
                  </Button>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={1}>Technical Indicators (Replay Data):</Text>
                  <Code p={2} borderRadius="md" w="100%" colorScheme="yellow" fontSize="xs">
                    <pre style={{ overflow: 'auto' }}>{JSON.stringify(selectedSignal.indicators_snapshot, null, 2)}</pre>
                  </Code>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button size="sm" colorScheme="blue" onClick={onClose}>
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SignalJournal;
