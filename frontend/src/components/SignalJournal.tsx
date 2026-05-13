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
} from '@chakra-ui/react';
import { ViewIcon, EditIcon, SearchIcon } from '@chakra-ui/icons';

interface Signal {
  timestamp: string;
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  price: number;
  strategy_name: string;
  reason: string;
  indicators_snapshot: any;
  order_id?: string;
  notes?: string;
}

const SignalJournal: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [tempNotes, setTempNotes] = useState('');

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

  return (
    <Box bg="gray.800" borderRadius="lg" p={4} shadow="md">
      <HStack justifyContent="space-between" mb={4}>
        <Text fontSize="lg" fontWeight="bold">Decision Journal</Text>
        <Button size="xs" colorScheme="red" variant="outline" onClick={handleClearJournal}>
          Clear
        </Button>
      </HStack>
      
      <Box overflowY="auto" maxH="400px">
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Time</Th>
              <Th>Action</Th>
              <Th isNumeric>Price</Th>
              <Th>Outcome</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {signals.map((signal, index) => (
              <Tr key={index} _hover={{ bg: "gray.700" }}>
                <Td fontSize="xs">{new Date(signal.timestamp).toLocaleTimeString()}</Td>
                <Td>
                  <Badge colorScheme={signal.action === 'buy' ? 'green' : signal.action === 'sell' ? 'red' : 'gray'}>
                    {signal.action.toUpperCase()}
                  </Badge>
                </Td>
                <Td isNumeric fontSize="xs">{signal.price.toLocaleString()}</Td>
                <Td fontSize="xs">
                  {signal.notes ? (
                    <Badge colorScheme="purple" variant="subtle">HAS NOTE</Badge>
                  ) : "-"}
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
          <ModalHeader>Signal Analysis & Replay</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedSignal && (
              <VStack align="stretch" spacing={4}>
                <HStack justifyContent="space-between">
                  <Text fontWeight="bold">Context:</Text>
                  <HStack>
                    <Badge colorScheme="blue">{selectedSignal.strategy_name}</Badge>
                    <Badge colorScheme={selectedSignal.action === 'buy' ? 'green' : 'red'}>
                      {selectedSignal.action.toUpperCase()}
                    </Badge>
                  </HStack>
                </HStack>
                
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
