import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  Badge,
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
  List,
  ListItem,
  Icon,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, AttachmentIcon, InfoOutlineIcon } from '@chakra-ui/icons';
import { demoFetch } from "../demo/demoFetch";

interface ReplaySnapshot {
  snapshot_id: string;
  id?: string;
  title: string;
  symbol: string;
  timestamp: string;
  signal_ids: string[];
  notes: string;
  created_at: string;
  last_replayed?: string;
}

const ReplaySnapshotManager: React.FC<{ symbol: string }> = ({ symbol }) => {
  const [snapshots, setSnapshots] = useState<ReplaySnapshot[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newSnapshot, setNewSnapshot] = useState({ title: '', notes: '' });
  const toast = useToast();

  const fetchSnapshots = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/replays/snapshots');
      const data = await response.json();
      setSnapshots(data);
    } catch (error) {
      console.error('Failed to fetch snapshots:', error);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const handleCreateSnapshot = async () => {
    if (!newSnapshot.title) {
        toast({ title: 'Title required', status: 'warning' });
        return;
    }
    
    try {
      const response = await demoFetch('http://localhost:8000/api/replays/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSnapshot.title,
          symbol: symbol,
          timestamp: new Date().toISOString(),
          notes: newSnapshot.notes,
          signal_ids: []
        })
      });
      
      if (response.ok) {
        toast({ title: 'Replay Moment Saved', status: 'success' });
        fetchSnapshots();
        onClose();
        setNewSnapshot({ title: '', notes: '' });
      }
    } catch (error) {
      toast({ title: 'Failed to save snapshot', status: 'error' });
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    try {
      const response = await demoFetch(`http://localhost:8000/api/replays/snapshots/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'Snapshot deleted', status: 'info' });
        fetchSnapshots();
      }
    } catch (error) {
        console.error(error);
    }
  };

  const handleApplySnapshot = (snapshot: ReplaySnapshot) => {
    const event = new CustomEvent('focus-chart', {
        detail: { timestamp: new Date(snapshot.timestamp).getTime() }
    });
    window.dispatchEvent(event);
    toast({ title: 'Replaying Snapshot moment', status: 'info', duration: 2000 });
  };

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <HStack justifyContent="space-between" mb={4}>
        <Text fontSize="xs" fontWeight="bold" letterSpacing="tight" color="gray.400">REPLAY ARCHIVE</Text>
        <IconButton 
          size="xs" 
          variant="ghost"
          colorScheme="brand" 
          aria-label="Add Snapshot" 
          icon={<AddIcon />} 
          onClick={onOpen} 
        />
      </HStack>

      <VStack align="stretch" spacing={2}>
        {snapshots.length === 0 ? (
          <Text fontSize="10px" color="ui.muted" fontStyle="italic">No saved moments yet.</Text>
        ) : (
          (snapshots || []).map(s => (
            <Box 
              key={s.snapshot_id || s.id} 
              p={2} 
              bg="blackAlpha.300" 
              borderRadius="md" 
              borderWidth="1px"
              borderColor="ui.border"
              _hover={{ borderColor: 'brand.500' }}
            >
              <VStack align="stretch" spacing={1}>
                <HStack justifyContent="space-between">
                    <VStack align="start" spacing={0} cursor="pointer" onClick={() => handleApplySnapshot(s)} flex={1}>
                    <Text fontWeight="bold" fontSize="xs" color="gray.200" noOfLines={1}>{s.title}</Text>
                    <Text fontSize="9px" color="ui.muted">Created {new Date(s.created_at || s.timestamp).toLocaleDateString()}</Text>
                    </VStack>
                    <IconButton 
                        size="2xs" 
                        variant="ghost"
                        colorScheme="red"
                        icon={<DeleteIcon w={2} h={2} />} 
                        aria-label="Delete" 
                        onClick={() => handleDeleteSnapshot(s.snapshot_id || s.id || '')}
                    />
                </HStack>
                <HStack justifyContent="space-between" mt={1}>
                    <Badge fontSize="8px" variant="outline" colorScheme="gray">{s.symbol}</Badge>
                    {s.last_replayed && (
                        <Text fontSize="8px" color="brand.200" fontStyle="italic">
                            Last replayed {Math.floor((Date.now() - new Date(s.last_replayed).getTime()) / 3600000)}h ago
                        </Text>
                    )}
                </HStack>
              </VStack>
            </Box>
          ))
        )}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="background.surface" color="white" borderWidth="1px" borderColor="ui.border">
          <ModalHeader fontSize="md">Save Replay Moment</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Input 
                placeholder="Moment Title (e.g., Bearish Divergence Peak)" 
                fontSize="sm"
                bg="blackAlpha.300"
                borderColor="ui.border"
                value={newSnapshot.title}
                onChange={(e) => setNewSnapshot({ ...newSnapshot, title: e.target.value })}
              />
              <Textarea 
                placeholder="Observation notes..." 
                fontSize="sm"
                bg="blackAlpha.300"
                borderColor="ui.border"
                value={newSnapshot.notes}
                onChange={(e) => setNewSnapshot({ ...newSnapshot, notes: e.target.value })}
              />
              <Text fontSize="9px" color="ui.muted">
                This will save the current chart state and symbol for quick return during review.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" colorScheme="brand" onClick={handleCreateSnapshot}>Save Moment</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ReplaySnapshotManager;
