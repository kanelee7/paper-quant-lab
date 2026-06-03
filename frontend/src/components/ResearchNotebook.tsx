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
  Tooltip,
  Input,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { 
  ChevronDownIcon, 
  ChevronRightIcon,
  CheckIcon,
  TimeIcon,
  LinkIcon,
  WarningIcon,
  AddIcon,
  InfoIcon,
  SearchIcon,
  StarIcon,
} from '@chakra-ui/icons';

export interface Finding {
  id: string;
  title: string;
  observation: string;
  confidence: number; // 0.0 to 1.0
  status: 'active' | 'archived' | 'contradicted';
  related_session_ids: string[];
  related_signal_ids: string[];
  supporting_evidence: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

export interface ObservationNote {
  id: string;
  timestamp: string;
  title: string;
  content: string;
  type: 'Observation' | 'Learning' | 'Review';
  linked_session_id?: string;
}

const ResearchNotebook: React.FC = () => {
  const { t } = useI18n();
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  const [findings, setFindings] = useState<Finding[]>([]);
  const [notes, setNotes] = useState<ObservationNote[]>([]);
  const [compressedKnowledge, setCompressedKnowledge] = useState<any[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newNote, setNewNote] = useState({ title: '', content: '', type: 'Observation' as ObservationNote['type'] });
  const toast = useToast();

  const fetchCompressedKnowledge = async () => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/insights/compression`);
      const data = await response.json();
      setCompressedKnowledge(data);
    } catch (e) {
      console.error('Failed to fetch compressed knowledge:', e);
    }
  };

  useEffect(() => {
    fetchCompressedKnowledge();
    const savedFindings = localStorage.getItem('pql_research_findings');
    if (savedFindings) {
      try {
        setFindings(JSON.parse(savedFindings));
      } catch (e) {
        setFindings([]);
      }
    } else {
        import('../demo/demoData').then(m => {
            if (m.demoFindings) {
                const initial = m.demoFindings.map((f: any) => ({
                    ...f,
                    related_session_ids: f.session_ids || [],
                    related_signal_ids: f.evidence_ids || [],
                    supporting_evidence: f.observation,
                    created_at: f.timestamp,
                    updated_at: f.timestamp,
                }));
                setFindings(initial);
                localStorage.setItem('pql_research_findings', JSON.stringify(initial));
            }
        });
    }

    const savedNotes = localStorage.getItem('pql_research_notes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        setNotes([]);
      }
    }

    const handleExternalAdd = (e: any) => {
        if (e.detail && e.detail.type === 'FINDING') {
            const f = e.detail.finding;
            setFindings(prev => {
                const updated = [f, ...(prev || [])];
                localStorage.setItem('pql_research_findings', JSON.stringify(updated));
                return updated;
            });
            toast({ title: 'Finding Captured', status: 'success', duration: 2000 });
        }
    };
    window.addEventListener('pql-add-finding', handleExternalAdd);
    return () => window.removeEventListener('pql-add-finding', handleExternalAdd);
  }, [toast]);

  const saveFindings = (updated: Finding[]) => {
      setFindings(updated);
      localStorage.setItem('pql_research_findings', JSON.stringify(updated));
  };

  const saveNotes = (updated: ObservationNote[]) => {
    setNotes(updated);
    localStorage.setItem('pql_research_notes', JSON.stringify(updated));
  };

  const handleAddNote = () => {
    if (!newNote.title || !newNote.content) return;
    const note: ObservationNote = {
      id: `note-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...newNote
    };
    saveNotes([note, ...(notes || [])]);
    setNewNote({ title: '', content: '', type: 'Observation' });
    setIsAddingNote(false);
    toast({ title: 'Observation Recorded', status: 'success', duration: 2000 });
  };

  const handleStatusChange = (id: string, status: Finding['status']) => {
      const updated = (findings || []).map(f => f.id === id ? { ...f, status, updated_at: new Date().toISOString() } : f);
      saveFindings(updated);
      toast({ title: `Finding marked as ${status}`, status: 'info' });
  };

  const getStatusColor = (status: Finding['status']) => {
      switch(status) {
          case 'active': return 'brand';
          case 'archived': return 'gray';
          case 'contradicted': return 'orange';
          default: return 'gray';
      }
  };

  const activeFindings = Array.isArray(findings) ? findings.filter(f => f.status === 'active') : [];
  const unresolvedItems = (Array.isArray(findings) ? findings.filter(f => f.status === 'contradicted').length : 0) + (Array.isArray(notes) ? notes.length : 0);

  return (
    <Box bg="background.surface" borderRadius="md" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <VStack align="stretch" spacing={4}>
        {/* Workspace Scorecard */}
        <SimpleGrid columns={4} spacing={2}>
            <Box p={2} bg="blackAlpha.300" borderRadius="xs" textAlign="center" borderWidth="1px" borderColor="whiteAlpha.100">
                <Text fontSize="8px" color="ui.muted" fontWeight="bold">RESEARCH</Text>
                <Text fontSize="md" fontWeight="900" color="brand.500">{activeFindings.length}</Text>
            </Box>
            <Box p={2} bg="blackAlpha.300" borderRadius="xs" textAlign="center" borderWidth="1px" borderColor="whiteAlpha.100">
                <Text fontSize="8px" color="ui.muted" fontWeight="bold">QUESTIONS</Text>
                <Text fontSize="md" fontWeight="900" color="blue.400">
                    {(() => {
                        try {
                            const h = JSON.parse(localStorage.getItem('pql_hypotheses') || '[]');
                            return (Array.isArray(h) ? h.filter((x: any) => x.status === 'active').length : 0);
                        } catch (e) { return 0; }
                    })()}
                </Text>
            </Box>
            <Box p={2} bg="blackAlpha.300" borderRadius="xs" textAlign="center" borderWidth="1px" borderColor="whiteAlpha.100">
                <Text fontSize="8px" color="ui.muted" fontWeight="bold">SESSIONS</Text>
                <Text fontSize="md" fontWeight="900" color="gray.200">
                    {(() => {
                        try {
                            const s = JSON.parse(localStorage.getItem('pql_sessions') || '[]');
                            return (Array.isArray(s) ? s.length : 0);
                        } catch (e) { return 0; }
                    })()}
                </Text>
            </Box>
            <Box p={2} bg="blackAlpha.300" borderRadius="xs" textAlign="center" borderWidth="1px" borderColor="whiteAlpha.100">
                <Text fontSize="8px" color="ui.muted" fontWeight="bold">UNRESOLVED</Text>
                <Text fontSize="md" fontWeight="900" color="orange.400">{unresolvedItems}</Text>
            </Box>
        </SimpleGrid>

        <HStack justifyContent="space-between">
            <HStack spacing={2}>
                <VStack align="start" spacing={0}>
                    <Text fontSize="10px" fontWeight="900" color="brand.500" letterSpacing="widest">{t('label.knowledge_archive')}</Text>
                    <Text fontSize="9px" color="ui.muted">KNOWLEDGE ANCHOR</Text>
                </VStack>
            </HStack>
            <HStack spacing={2}>
                <Button size="2xs" leftIcon={<AddIcon />} colorScheme="brand" variant="ghost" onClick={() => setIsAddingNote(!isAddingNote)} fontSize="10px" borderRadius="xs">
                    CAPTURE
                </Button>
                <IconButton 
                    size="xs" 
                    variant="ghost" 
                    icon={isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />} 
                    onClick={onToggle}
                    aria-label="Toggle Notebook"
                />
            </HStack>
        </HStack>

        <Collapse in={isOpen}>
            <Tabs variant="unstyled" size="sm">
                <TabList bg="blackAlpha.400" p={0.5} borderRadius="sm" mb={4}>
                    {['FINDINGS', 'NOTES', 'DISCOVERY'].map((label) => (
                        <Tab 
                            key={label}
                            flex={1}
                            fontSize="9px" 
                            fontWeight="900" 
                            color="ui.muted"
                            borderRadius="xs"
                            _selected={{ bg: 'whiteAlpha.100', color: 'brand.500' }}
                            py={1.5}
                        >
                            {label === 'FINDINGS' ? t('label.research_findings') : label === 'NOTES' ? t('label.research_notes') : '분석 결과'}
                        </Tab>
                    ))}
                </TabList>

                <TabPanels>
                    {/* Findings Panel */}
                    <TabPanel p={0}>
                        <VStack align="stretch" spacing={3}>
                            {activeFindings.length === 0 && (
                                <Text fontSize="10px" color="ui.muted" fontStyle="italic" textAlign="center" py={4}>{t('empty.no_findings')}</Text>
                            )}
                            {activeFindings.map(f => (
                                <Box key={f.id} p={3} bg="blackAlpha.200" borderRadius="sm" borderLeft="3px solid" borderColor={getStatusColor(f.status) + '.500'}>
                                    <VStack align="stretch" spacing={2}>
                                        <HStack justifyContent="space-between">
                                            <Text fontSize="xs" fontWeight="bold" color="gray.200">{f.title}</Text>
                                            <Badge colorScheme={getStatusColor(f.status)} fontSize="8px">{f.status.toUpperCase()}</Badge>
                                        </HStack>
                                        <Text fontSize="11px" color="gray.400" lineHeight="1.6">{f.observation}</Text>
                                        <HStack justifyContent="space-between">
                                            <Text fontSize="9px" color="ui.muted">{new Date(f.created_at).toLocaleDateString()}</Text>
                                            <Button size="2xs" variant="ghost" colorScheme="brand" fontSize="9px" height="auto" py={0.5} onClick={() => {
                                                const event = new CustomEvent('focus-finding', { detail: { findingId: f.id, evidenceIds: f.related_signal_ids } });
                                                window.dispatchEvent(event);
                                            }}>VIEW EVIDENCE</Button>
                                        </HStack>
                                    </VStack>
                                </Box>
                            ))}
                        </VStack>
                    </TabPanel>

                    {/* Observations Panel */}
                    <TabPanel p={0}>
                        <VStack align="stretch" spacing={3}>
                            <Collapse in={isAddingNote}>
                                <VStack align="stretch" spacing={3} p={3} bg="blackAlpha.300" borderRadius="sm" borderWidth="1px" borderColor="brand.500" mb={2}>
                                    <Select size="xs" bg="background.deep" value={newNote.type} onChange={(e) => setNewNote({...newNote, type: e.target.value as any})} fontSize="10px">
                                        <option value="Observation">Observation</option>
                                        <option value="Learning">Learning</option>
                                        <option value="Review">Review</option>
                                    </Select>
                                    <Input placeholder="Context..." size="xs" value={newNote.title} onChange={(e) => setNewNote({...newNote, title: e.target.value})} bg="background.deep" />
                                    <Textarea placeholder="Note content..." size="sm" fontSize="xs" rows={3} value={newNote.content} onChange={(e) => setNewNote({...newNote, content: e.target.value})} bg="background.deep" />
                                    <Button size="xs" colorScheme="brand" onClick={handleAddNote}>CAPTURE</Button>
                                </VStack>
                            </Collapse>
                            {(notes || []).map(note => (
                                <Box key={note.id} p={2} bg="blackAlpha.100" borderRadius="sm" borderLeft="2px solid" borderColor={note.type === 'Review' ? 'pink.500' : 'blue.500'}>
                                    <HStack justify="space-between" mb={1}>
                                        <Text fontSize="xs" fontWeight="bold" noOfLines={1}>{note.title}</Text>
                                        <Text fontSize="8px" color="ui.muted">{new Date(note.timestamp).toLocaleDateString()}</Text>
                                    </HStack>
                                    <Text fontSize="10px" color="gray.400" noOfLines={2}>{note.content}</Text>
                                </Box>
                            ))}
                        </VStack>
                    </TabPanel>

                    {/* Discovery / Compression Panel */}
                    <TabPanel p={0}>
                        <VStack align="stretch" spacing={4}>
                            <Input size="xs" placeholder="Search patterns..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} bg="blackAlpha.300" borderColor="ui.border" />
                            
                            <Box>
                                <Text fontSize="9px" fontWeight="800" color="brand.200" mb={2} letterSpacing="widest">COMPRESSED KNOWLEDGE</Text>
                                <VStack align="stretch" spacing={2}>
                                    {(compressedKnowledge || []).map((ck, idx) => (
                                        <Box key={idx} p={2} bg="whiteAlpha.50" borderRadius="sm" borderLeft="2px solid" borderColor={ck.severity === 'high' ? 'red.500' : 'orange.500'}>
                                            <HStack justify="space-between" mb={1}>
                                                <Text fontSize="xs" fontWeight="bold" color="gray.200">{ck.label}</Text>
                                                <Badge fontSize="8px" colorScheme={ck.severity === 'high' ? 'red' : 'orange'}>
                                                    {(ck.type || '').replace('_', ' ').toUpperCase()}
                                                </Badge>
                                            </HStack>
                                            <Text fontSize="10px" color="ui.muted">{ck.content}</Text>
                                        </Box>
                                    ))}
                                </VStack>
                            </Box>
                        </VStack>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Collapse>
      </VStack>
    </Box>
  );
};

export default ResearchNotebook;
