import React, { useState, useEffect } from 'react';
import { demoFetch } from "../demo/demoFetch";
import { API_BASE_URL } from '../config/api';
import { useI18n } from '../i18n';
import {
  Box,
  VStack,
  HStack,
  Text,
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
  const { t } = useI18n();
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  const [entries, setEntries] = useState<ReflectionEntry[]>([]);
  const [resolvedHypotheses, setResolvedHypotheses] = useState<any[]>([]);
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

    // Sync resolved hypotheses
    const syncHypotheses = () => {
        const savedH = localStorage.getItem('pql_hypotheses');
        if (savedH) {
            const hList = JSON.parse(savedH).filter((h: any) => h.status === 'resolved' || h.status === 'invalidated');
            setResolvedHypotheses(hList);
        }
    };
    syncHypotheses();
    window.addEventListener('storage', syncHypotheses);
    return () => window.removeEventListener('storage', syncHypotheses);
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/sessions`);
      const data = await response.json();
      setSessions(data);
    } catch (e) { }
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
    <Box bg="background.surface" borderRadius="md" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <HStack justifyContent="space-between" mb={2}>
        <HStack spacing={2}>
            <VStack align="start" spacing={0}>
                <Text fontSize="10px" fontWeight="900" color="brand.500" letterSpacing="widest">{t('label.research_notes')}</Text>
                <Text fontSize="9px" color="ui.muted">ARCHIVE</Text>
            </VStack>
            {(entries || []).length > 0 && <Badge variant="subtle" fontSize="9px" borderRadius="xs">{(entries || []).length} RECORDS</Badge>}
        </HStack>
        <HStack spacing={2}>
            <Button size="2xs" leftIcon={isEditing ? <ChevronRightIcon /> : <EditIcon />} colorScheme="brand" variant="ghost" onClick={() => setIsEditing(!isEditing)} fontSize="10px" borderRadius="xs">
                {isEditing ? 'DISCARD' : 'NEW ENTRY'}
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
        <VStack align="stretch" spacing={4} mt={(entries || []).length > 0 || isEditing ? 2 : 0}>
          {(entries || []).length > 0 && <Text fontSize="11px" color="ui.muted">Synthesized takeaways from longitudinal market observation and evidence review.</Text>}
          
          <Collapse in={isEditing}>
            <VStack align="stretch" spacing={3} p={3} bg="blackAlpha.300" borderRadius="sm" borderWidth="1px" borderColor="brand.500" mb={4}>
                <HStack spacing={2}>
                    <Select size="xs" w="120px" bg="background.deep" borderColor="ui.border" value={newType} onChange={(e) => setNewType(e.target.value as any)} fontSize="10px" borderRadius="xs">
                        <option value="Observation">Observation</option>
                        <option value="Learning">Learning</option>
                        <option value="Hypothesis">Hypothesis</option>
                        <option value="Conclusion">Conclusion</option>
                    </Select>
                    <Select size="xs" bg="background.deep" borderColor="ui.border" value={linkedSession} onChange={(e) => setLinkedSession(e.target.value)} fontSize="10px" borderRadius="xs">
                        <option value="">Contextual Link (Optional)</option>
                        {(sessions || []).map(s => (
                            <option key={s.session_id} value={s.session_id}>{s.title}</option>
                        ))}
                    </Select>
                </HStack>
                <Box>
                    <Text fontSize="9px" color="ui.muted" mb={1} fontWeight="800" textTransform="uppercase">Record Identifier</Text>
                    <Textarea 
                        placeholder="e.g., Sentiment Divergence Analysis" 
                        size="sm" 
                        fontSize="xs" 
                        rows={1}
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        bg="background.deep"
                        borderColor="ui.border"
                        borderRadius="xs"
                    />
                </Box>
                <Box>
                    <Text fontSize="9px" color="ui.muted" mb={1} fontWeight="800" textTransform="uppercase">Observation</Text>
                    <Textarea 
                        placeholder="Detail the analytical findings or cross-session patterns..." 
                        size="sm" 
                        fontSize="xs" 
                        rows={4}
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        bg="background.deep"
                        borderColor="ui.border"
                        borderRadius="xs"
                    />
                </Box>
                <Button size="xs" colorScheme="brand" rightIcon={<CheckIcon />} onClick={handleAddEntry} fontWeight="800" letterSpacing="wider" borderRadius="xs">COMMIT REFLECTION</Button>
            </VStack>
          </Collapse>

          <VStack align="stretch" spacing={3} maxH={(entries || []).length > 3 ? "400px" : "auto"} overflowY="auto" pr={2}>
            {(entries || []).length === 0 && !isEditing && (
                <Box py={10} px={4} textAlign="center" borderRadius="sm" border="1px dashed" borderColor="ui.border" bg="blackAlpha.100">
                    <VStack spacing={3}>
                        <Icon as={ChatIcon} color="ui.muted" w={5} h={5} opacity={0.5} />
                        <VStack spacing={1}>
                            <Text fontSize="xs" color="gray.300" fontWeight="800" letterSpacing="widest">NO RESEARCH NOTES</Text>
                            <Text fontSize="10px" color="ui.muted" maxW="240px" lineHeight="tall">
                                {t('empty.no_notes')}
                            </Text>
                        </VStack>
                        <Button 
                            size="xs" 
                            variant="outline" 
                            colorScheme="brand" 
                            fontSize="9px" 
                            mt={1}
                            onClick={() => setIsEditing(true)}
                        >
                            ADD FIRST NOTE
                        </Button>
                    </VStack>
                </Box>
            )}
            
            {(entries || []).map(entry => (
                <Box key={entry.id} p={3} bg="blackAlpha.200" borderRadius="sm" borderLeft="3px solid" borderColor={getTypeColor(entry.type) + ".500"}>
                    <VStack align="stretch" spacing={2}>
                        <HStack justifyContent="space-between">
                            <HStack spacing={2}>
                                <Badge colorScheme={getTypeColor(entry.type)} fontSize="8px" variant="solid" borderRadius="xs">{entry.type}</Badge>
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
                        
                        <Text fontSize="11px" color="gray.400" lineHeight="1.6">{entry.content}</Text>
                        
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
                                        <Text fontSize="9px" color="brand.500" fontWeight="bold" textTransform="uppercase" letterSpacing="tighter">{getSessionTitle(entry.linked_session_id)}</Text>
                                    </HStack>
                                )}
                            </HStack>
                        </HStack>
                    </VStack>
                </Box>
            ))}

            {(resolvedHypotheses || []).length > 0 && (
                <>
                    <HStack spacing={2} pt={2}>
                        <Text fontSize="9px" fontWeight="800" color="ui.muted" letterSpacing="widest">{t('label.research_findings')}</Text>
                        <Divider flex={1} borderColor="whiteAlpha.100" />
                    </HStack>
                    {(resolvedHypotheses || []).map(h => (
                        <Box key={h.id} p={3} bg="blackAlpha.300" borderRadius="sm" borderLeft="3px solid" borderColor={h.status === 'resolved' ? "green.500" : "red.500"}>
                            <VStack align="stretch" spacing={2}>
                                <HStack justifyContent="space-between">
                                    <HStack spacing={2}>
                                        <Badge colorScheme={h.status === 'resolved' ? "green" : "red"} fontSize="8px" variant="solid" borderRadius="xs">{h.status.toUpperCase()}</Badge>
                                        <Text fontSize="xs" fontWeight="bold" color="gray.200">{h.title}</Text>
                                    </HStack>
                                    <Icon as={LinkIcon} w={2.5} h={2.5} color="ui.muted" />
                                </HStack>
                                <Text fontSize="10px" color="gray.400" lineHeight="1.5">{h.description}</Text>
                                <HStack spacing={3}>
                                    <HStack spacing={1}>
                                        <Icon as={TimeIcon} w={2.5} h={2.5} color="ui.muted" />
                                        <Text fontSize="9px" color="ui.muted">RESOLVED: {new Date(h.timestamp).toLocaleDateString()}</Text>
                                    </HStack>
                                </HStack>
                            </VStack>
                        </Box>
                    ))}
                </>
            )}
          </VStack>
        </VStack>
      </Collapse>
    </Box>
  );
};

export default ResearchJournal;
