import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Icon,
  Button,
  Textarea,
  Collapse,
  useDisclosure,
  IconButton,
  Divider,
  useToast,
  Select,
} from '@chakra-ui/react';
import { 
  ChevronRightIcon, 
  ChevronDownIcon, 
  EditIcon,
  CheckIcon,
  TimeIcon,
  LinkIcon,
  ChatIcon
} from '@chakra-ui/icons';

interface ReflectionEntry {
  id: string;
  timestamp: string;
  title: string;
  content: string;
  type: 'Conclusion' | 'Learning' | 'Hypothesis' | 'Observation';
  linked_session_id?: string;
}

const ResearchJournal: React.FC = () => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  const [entries, setEntries] = useState<ReflectionEntry[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<ReflectionEntry['type']>('Observation');
  const [sessions, setSessions] = useState<any[]>([]);
  const [linkedSession, setLinkedSession] = useState('');
  
  const toast = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('pql_research_journal');
    if (saved) {
      setEntries(JSON.parse(saved));
    }
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/sessions');
      const data = await response.json();
      setSessions(data);
    } catch (e) {}
  };

  const saveEntries = (updated: ReflectionEntry[]) => {
    setEntries(updated);
    localStorage.setItem('pql_research_journal', JSON.stringify(updated));
  };

  const handleAddEntry = () => {
    if (!newTitle || !newContent) return;
    
    const entry: ReflectionEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      title: newTitle,
      content: newContent,
      type: newType,
      linked_session_id: linkedSession || undefined,
    };
    
    saveEntries([entry, ...entries]);
    setNewTitle('');
    setNewContent('');
    setIsEditing(false);
    toast({ title: 'Reflection Captured', status: 'success', duration: 2000 });
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Delete this reflection?')) {
      saveEntries(entries.filter(e => e.id !== id));
    }
  };

  const getSessionTitle = (id: string) => {
    const s = sessions.find(s => s.session_id === id);
    return s ? s.title : 'Unknown Session';
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Conclusion': return 'red';
      case 'Learning': return 'green';
      case 'Hypothesis': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <HStack justifyContent="space-between" mb={2}>
        <HStack spacing={2}>
            <Heading size="xs" color="brand.500" letterSpacing="widest" textTransform="uppercase">Research Reflections</Heading>
            <Badge variant="subtle" fontSize="9px">{entries.length} ENTRIES</Badge>
        </HStack>
        <HStack spacing={2}>
            <Button size="2xs" leftIcon={isEditing ? <ChevronRightIcon /> : <EditIcon />} colorScheme="brand" variant="ghost" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? 'Cancel' : 'Add Reflection'}
            </Button>
            <IconButton 
            size="xs" 
            variant="ghost" 
            icon={isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />} 
            onClick={onToggle}
            aria-label="Toggle Journal"
            />
        </HStack>
      </HStack>

      <Collapse in={isOpen}>
        <VStack align="stretch" spacing={4} mt={2}>
          <Text fontSize="11px" color="ui.muted">Record longitudinal takeaways and analytical conclusions.</Text>
          
          <Collapse in={isEditing}>
            <VStack align="stretch" spacing={3} p={3} bg="blackAlpha.300" borderRadius="md" borderWidth="1px" borderColor="brand.500">
                <HStack spacing={2}>
                    <Select size="xs" w="120px" bg="background.deep" value={newType} onChange={(e) => setNewType(e.target.value as any)}>
                        <option value="Observation">Observation</option>
                        <option value="Learning">Learning</option>
                        <option value="Hypothesis">Hypothesis</option>
                        <option value="Conclusion">Conclusion</option>
                    </Select>
                    <Select size="xs" bg="background.deep" value={linkedSession} onChange={(e) => setLinkedSession(e.target.value)}>
                        <option value="">Link to Session (Optional)</option>
                        {sessions.map(s => (
                            <option key={s.session_id} value={s.session_id}>{s.title}</option>
                        ))}
                    </Select>
                </HStack>
                <Box>
                    <Text fontSize="10px" color="ui.muted" mb={1} fontWeight="bold">TITLE</Text>
                    <Textarea 
                        placeholder="e.g., Identifying False Volatility Spikes" 
                        size="sm" 
                        fontSize="xs" 
                        rows={1}
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        bg="background.deep"
                        borderColor="ui.border"
                    />
                </Box>
                <Box>
                    <Text fontSize="10px" color="ui.muted" mb={1} fontWeight="bold">REFLECTIVE CONTENT</Text>
                    <Textarea 
                        placeholder="What did you learn from this experiment?" 
                        size="sm" 
                        fontSize="xs" 
                        rows={4}
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        bg="background.deep"
                        borderColor="ui.border"
                    />
                </Box>
                <Button size="xs" colorScheme="brand" rightIcon={<CheckIcon />} onClick={handleAddEntry}>Capture Reflection</Button>
            </VStack>
          </Collapse>

          <VStack align="stretch" spacing={3} maxH="500px" overflowY="auto" pr={2}>
            {entries.length === 0 && !isEditing && (
                <Box p={8} textAlign="center" borderRadius="md" border="1px dashed" borderColor="ui.border">
                    <Icon as={ChatIcon} color="ui.muted" mb={2} />
                    <Text fontSize="xs" color="ui.muted">No reflections captured yet.</Text>
                </Box>
            )}
            
            {entries.map(entry => (
                <Box key={entry.id} p={3} bg="blackAlpha.200" borderRadius="md" borderLeft="3px solid" borderColor={getTypeColor(entry.type) + ".500"}>
                    <VStack align="stretch" spacing={2}>
                        <HStack justifyContent="space-between">
                            <HStack spacing={2}>
                                <Badge colorScheme={getTypeColor(entry.type)} fontSize="8px">{entry.type}</Badge>
                                <Text fontSize="xs" fontWeight="bold" color="gray.200">{entry.title}</Text>
                            </HStack>
                            <IconButton 
                                size="2xs" 
                                variant="ghost" 
                                colorScheme="red" 
                                icon={<Text fontSize="14px">×</Text>} 
                                onClick={() => handleDeleteEntry(entry.id)}
                                aria-label="Delete"
                            />
                        </HStack>
                        
                        <Text fontSize="xs" color="gray.400" lineHeight="tall">{entry.content}</Text>
                        
                        <Divider borderColor="whiteAlpha.50" />
                        
                        <HStack justifyContent="space-between">
                            <HStack spacing={3}>
                                <HStack spacing={1}>
                                    <Icon as={TimeIcon} w={2.5} h={2.5} color="ui.muted" />
                                    <Text fontSize="9px" color="ui.muted">{new Date(entry.timestamp).toLocaleDateString()}</Text>
                                </HStack>
                                {entry.linked_session_id && (
                                    <HStack spacing={1}>
                                        <Icon as={LinkIcon} w={2.5} h={2.5} color="brand.500" />
                                        <Text fontSize="9px" color="brand.500" fontWeight="bold">{getSessionTitle(entry.linked_session_id)}</Text>
                                    </HStack>
                                )}
                            </HStack>
                        </HStack>
                    </VStack>
                </Box>
            ))}
          </VStack>
        </VStack>
      </Collapse>
    </Box>
  );
};

export default ResearchJournal;
