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
  Icon,
  Tooltip,
  Select,
} from '@chakra-ui/react';
import { DownloadIcon, AttachmentIcon, InfoOutlineIcon } from '@chakra-ui/icons';

interface Archive {
  archive_id: string;
  title: string;
  description: string;
  created_at: string;
  schema_version: string;
  replay_version: string;
  included_components: string[];
  session_count?: number;
  signal_count?: number;
}

const ResearchArchiveManager: React.FC = () => {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<Archive | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const [newArchive, setNewArchive] = useState({ title: '', description: '' });
  const [importMode, setMode] = useState('merge');
  const toast = useToast();

  const fetchArchives = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/archives');
      const data = await response.json();
      setArchives(data);
    } catch (error) {
      console.error('Failed to fetch archives:', error);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  const handleCreateArchive = async () => {
    if (!newArchive.title) {
      toast({ title: 'Title required', status: 'warning' });
      return;
    }
    try {
      const response = await demoFetch('http://localhost:8000/api/archives/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArchive)
      });
      if (response.ok) {
        toast({ title: 'Archive Frozen', status: 'success' });
        fetchArchives();
        onClose();
        setNewArchive({ title: '', description: '' });
      }
    } catch (error) {
      toast({ title: 'Freeze failed', status: 'error' });
    }
  };

  const handleImport = async () => {
    if (!selectedArchive) return;
    try {
      const response = await demoFetch(`http://localhost:8000/api/archives/${selectedArchive.archive_id}/import?mode=${importMode}`, {
        method: 'POST'
      });
      if (response.ok) {
        toast({ title: 'Research State Restored', description: `Successfully imported ${selectedArchive.title}`, status: 'success' });
        onDetailClose();
        window.location.reload();
      }
    } catch (error) {
      toast({ title: 'Restoration Failed', status: 'error' });
    }
  };

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <HStack justifyContent="space-between" mb={4}>
        <Text fontSize="xs" fontWeight="bold" letterSpacing="tight" color="gray.400">STATE REPOSITORIES</Text>
        <Button size="xs" variant="ghost" colorScheme="brand" leftIcon={<DownloadIcon />} onClick={onOpen} fontSize="9px">
          Freeze Environment
        </Button>
      </HStack>

      <List spacing={2}>
        {archives.length === 0 ? (
          <Text fontSize="10px" color="ui.muted" fontStyle="italic">No archived states found.</Text>
        ) : (
          (archives || []).map(archive => (
            <ListItem 
                key={archive.archive_id} 
                p={2} 
                bg="blackAlpha.300" 
                borderRadius="md" 
                borderWidth="1px"
                borderColor="ui.border"
                _hover={{ borderColor: 'brand.500' }}
            >
              <HStack justifyContent="space-between">
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontWeight="bold" fontSize="xs" color="gray.200" noOfLines={1}>{archive.title}</Text>
                  <HStack spacing={2}>
                    <Text fontSize="9px" color="ui.muted">{new Date(archive.created_at).toLocaleDateString()}</Text>
                    <Badge fontSize="8px" variant="ghost" color="brand.200">{archive.session_count || 0} sessions</Badge>
                  </HStack>
                </VStack>
                <HStack>
                    <IconButton 
                        size="xs" 
                        variant="ghost"
                        icon={<Icon as={InfoOutlineIcon} w={3} h={3} />} 
                        aria-label="View Archive" 
                        onClick={() => { setSelectedArchive(archive); onDetailOpen(); }}
                    />
                </HStack>
              </HStack>
            </ListItem>
          ))
        )}
      </List>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="background.surface" color="white" borderWidth="1px" borderColor="ui.border">
          <ModalHeader fontSize="md" fontWeight="bold">Freeze Research State</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Input 
                placeholder="Repository Title..." 
                fontSize="xs"
                bg="blackAlpha.300"
                borderColor="ui.border"
                value={newArchive.title}
                onChange={(e) => setNewArchive({ ...newArchive, title: e.target.value })}
              />
              <Textarea 
                placeholder="Contextual notes for this snapshot..." 
                fontSize="xs"
                bg="blackAlpha.300"
                borderColor="ui.border"
                value={newArchive.description}
                onChange={(e) => setNewArchive({ ...newArchive, description: e.target.value })}
              />
              <Text fontSize="9px" color="ui.muted">
                This creates an immutable, multi-layered package of all current sessions, signals, and governance traces.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="ui.border">
            <Button size="sm" colorScheme="brand" onClick={handleCreateArchive}>Archive State</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="background.surface" color="white" borderWidth="1px" borderColor="ui.border">
          <ModalHeader fontSize="md" fontWeight="bold">Repository Explorer</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedArchive && (
              <VStack align="stretch" spacing={5}>
                <Box>
                  <Text fontSize="9px" color="ui.muted" fontWeight="bold" mb={1}>ARCHIVE IDENTIFIER</Text>
                  <Text fontSize="xs" color="brand.200" fontFamily="mono">{selectedArchive.archive_id}</Text>
                </Box>
                <Box>
                  <Text fontSize="9px" color="ui.muted" fontWeight="bold" mb={2}>BUNDLED LAYERS</Text>
                  <HStack spacing={2} wrap="wrap">
                    {['SESSIONS', 'SIGNALS', 'COMMENTS', 'REPLAYS', 'GOVERNANCE'].map(c => (
                      <Badge key={c} colorScheme="green" variant="subtle" fontSize="8px">{c}</Badge>
                    ))}
                  </HStack>
                </Box>
                <Box bg="blackAlpha.400" p={3} borderRadius="md" borderWidth="1px" borderColor="ui.border">
                  <Text fontSize="9px" color="ui.muted" fontWeight="bold" mb={2}>REPRODUCIBILITY METADATA</Text>
                  <HStack spacing={8}>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="9px" color="gray.600">SCHEMA</Text>
                      <Text fontSize="xs" fontWeight="bold">{selectedArchive.schema_version || '2.4.x'}</Text>
                    </VStack>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="9px" color="gray.600">REPLAY LOGIC</Text>
                      <Text fontSize="xs" fontWeight="bold">{selectedArchive.replay_version || 'v2-compat'}</Text>
                    </VStack>
                  </HStack>
                </Box>
                
                <Box pt={2}>
                    <Text fontSize="9px" color="ui.muted" fontWeight="bold" mb={2}>RESTORE WORKFLOW</Text>
                    <HStack mb={3}>
                        <Select size="xs" bg="blackAlpha.300" borderColor="ui.border" value={importMode} onChange={(e) => setMode(e.target.value)}>
                            <option value="merge">Non-Destructive Layer Merge</option>
                            <option value="overwrite">Full State Overwrite</option>
                        </Select>
                    </HStack>
                    <Button 
                        w="100%" 
                        size="xs" 
                        colorScheme="brand" 
                        leftIcon={<AttachmentIcon />}
                        onClick={handleImport}
                        fontWeight="800"
                        letterSpacing="widest"
                    >
                        RESTORE RESEARCH STATE
                    </Button>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="ui.border">
            <Button size="sm" variant="ghost" onClick={onDetailClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ResearchArchiveManager;
