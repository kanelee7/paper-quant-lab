import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Button,
  Input,
  Textarea,
  Collapse,
  useDisclosure,
  IconButton,
  Divider,
  useToast,
  Select,
  Progress,
  Tooltip,
} from '@chakra-ui/react';
import { 
  ChevronRightIcon, 
  ChevronDownIcon, 
  AddIcon,
  CheckIcon,
  TimeIcon,
  LinkIcon,
  InfoOutlineIcon,
  ArrowForwardIcon,
} from '@chakra-ui/icons';
import { demoFetch } from "../demo/demoFetch";
import { API_BASE_URL } from '../config/api';
import { useI18n } from '../i18n';

export interface Hypothesis {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  status: 'active' | 'resolved' | 'unresolved' | 'invalidated';
  confidence: number;
  tags: string[];
  linked_session_id?: string;
  linked_replay_checkpoint?: string;
  evolution: {
    timestamp: string;
    note: string;
  }[];
}

interface HypothesisManagerProps {
  investigatingSignalId?: string | null;
}

const HypothesisManager: React.FC<HypothesisManagerProps> = ({ investigatingSignalId }) => {
  const { lang, t } = useI18n();
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [linkedSession, setLinkedSession] = useState('');
  
  const toast = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('pql_hypotheses');
    if (saved) {
      setHypotheses(JSON.parse(saved));
    }
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/sessions`);
      const data = await response.json();
      setSessions(data);
    } catch (e) { }
  };

  const saveHypotheses = (updated: Hypothesis[]) => {
    setHypotheses(updated);
    localStorage.setItem('pql_hypotheses', JSON.stringify(updated));
  };

  const handleAddHypothesis = () => {
    if (!newTitle || !newDesc) return;
    
    const h: Hypothesis = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      title: newTitle,
      description: newDesc,
      status: 'active',
      confidence: 0.5,
      tags: [], // Initialize tags
      linked_session_id: linkedSession || undefined,
      evolution: [{ timestamp: new Date().toISOString(), note: lang === 'ko' ? "가설이 수립되었습니다." : "Hypothesis established." }],
    };
    
    saveHypotheses([h, ...hypotheses]);
    setNewTitle('');
    setNewDesc('');
    setIsAdding(false);
    toast({ title: lang === 'ko' ? '가설 수립됨' : 'Hypothesis Established', status: 'success', duration: 2000 });
  };

  const handleResolve = (id: string, status: Hypothesis['status']) => {
    const updated = hypotheses.map(h => {
        if (h.id === id) {
            return { 
                ...h, 
                status, 
                evolution: [...h.evolution, { 
                    timestamp: new Date().toISOString(), 
                    note: lang === 'ko' ? `상태가 ${status}로 업데이트되었습니다.` : `Status updated to ${status}.` 
                }] 
            };
        }
        return h;
    });
    saveHypotheses(updated);
    toast({ title: lang === 'ko' ? `가설 ${status}` : `Hypothesis ${status}`, status: status === 'resolved' ? 'success' : 'info' });
  };

  const handlePromoteToFinding = (h: Hypothesis) => {
    const finding = {
        id: `finding-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        title: lang === 'ko' ? `연구 결과: ${h.title}` : `Finding: ${h.title}`,
        observation: h.description,
        related_signal_ids: h.linked_replay_checkpoint ? [h.linked_replay_checkpoint] : [],
        related_session_ids: h.linked_session_id ? [h.linked_session_id] : [],
        confidence: h.confidence,
        status: h.status === 'resolved' ? 'active' : 'contradicted',
        supporting_evidence: `Promoted from hypothesis: "${h.title}". Resolution: ${h.status.toUpperCase()}.`,
        tags: ['promoted', 'hypothesis-backed']
    };
    
    const event = new CustomEvent('pql-add-finding', { detail: { type: 'FINDING', finding } });
    window.dispatchEvent(event);
    
    toast({ title: lang === 'ko' ? '연구 결과로 승격됨' : 'Hypothesis Promoted', description: lang === 'ko' ? '노트북에 새로운 연구 결과가 추가되었습니다.' : 'Finding established in research notebook.', status: 'success' });
  };

  const getStatusColor = (status: Hypothesis['status']) => {
    switch(status) {
      case 'active': return 'blue';
      case 'resolved': return 'green';
      case 'invalidated': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box bg="background.surface" borderRadius="md" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <HStack justifyContent="space-between" mb={2}>
        <HStack spacing={2}>
            <VStack align="start" spacing={0}>
                <Text fontSize="10px" fontWeight="900" color="brand.500" letterSpacing="widest">{lang === 'ko' ? "가설 추적" : "HYPOTHESIS TRACKING"}</Text>
                <Text fontSize="9px" color="ui.muted">{lang === 'ko' ? "연구 질문 관리" : "EVOLVING RESEARCH QUESTIONS"}</Text>
            </VStack>
            {(hypotheses || []).filter(h => h.status === 'active').length > 0 && (
                <Badge variant="subtle" colorScheme="blue" fontSize="9px" borderRadius="xs">
                    {(hypotheses || []).filter(h => h.status === 'active').length} {lang === 'ko' ? "활성" : "ACTIVE"}
                </Badge>
            )}
        </HStack>
        <HStack spacing={2}>
            <Button size="2xs" leftIcon={isAdding ? <ChevronRightIcon /> : <AddIcon />} colorScheme="brand" variant="ghost" onClick={() => setIsAdding(!isAdding)} fontSize="10px" borderRadius="xs">
                {isAdding ? (lang === 'ko' ? '취소' : 'DISCARD') : (lang === 'ko' ? '새 질문' : 'NEW QUESTION')}
            </Button>
            <IconButton 
                size="xs" 
                variant="ghost" 
                icon={isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />} 
                onClick={onToggle}
                aria-label="Toggle Hypotheses"
            />
        </HStack>
      </HStack>

      <Collapse in={isOpen}>
        <VStack align="stretch" spacing={4} mt={(hypotheses || []).length > 0 || isAdding ? 2 : 0}>
          <Collapse in={isAdding}>
            <VStack align="stretch" spacing={3} p={3} bg="blackAlpha.300" borderRadius="sm" borderWidth="1px" borderColor="brand.500" mb={4}>
                <Select size="xs" bg="background.deep" borderColor="ui.border" value={linkedSession} onChange={(e) => setLinkedSession(e.target.value)} fontSize="10px" borderRadius="xs">
                    <option value="">{lang === 'ko' ? "세션 연결 (선택 사항)" : "Link to Session (Optional)"}</option>
                    {(sessions || []).map(s => (
                        <option key={s.session_id} value={s.session_id}>{s.title}</option>
                    ))}
                </Select>
                <Box>
                    <Text fontSize="9px" color="ui.muted" mb={1} fontWeight="800" textTransform="uppercase">{lang === 'ko' ? "가설 제목" : "Hypothesis Title"}</Text>
                    <Input 
                        placeholder={lang === 'ko' ? "예: 돌파 추세의 약화 가능성" : "e.g., Breakout continuation likely weakening"} 
                        size="sm" 
                        fontSize="xs" 
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        bg="background.deep"
                        borderColor="ui.border"
                        borderRadius="xs"
                    />
                </Box>
                <Box>
                    <Text fontSize="9px" color="ui.muted" mb={1} fontWeight="800" textTransform="uppercase">{lang === 'ko' ? "판단 논리" : "Logic"}</Text>
                    <Textarea 
                        placeholder={lang === 'ko' ? "이 가설의 근거 또는 트리거를 설명하세요..." : "Explain the logic or triggers for this hypothesis..."} 
                        size="sm" 
                        fontSize="xs" 
                        rows={3}
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        bg="background.deep"
                        borderColor="ui.border"
                        borderRadius="xs"
                    />
                </Box>
                <Button size="xs" colorScheme="brand" rightIcon={<ArrowForwardIcon />} onClick={handleAddHypothesis} fontWeight="800" letterSpacing="wider" borderRadius="xs">
                    {lang === 'ko' ? "가설 수립" : "ESTABLISH HYPOTHESIS"}
                </Button>
            </VStack>
          </Collapse>

          <VStack align="stretch" spacing={3} maxH="400px" overflowY="auto" pr={2}>
            {(hypotheses || []).length === 0 && !isAdding && (
                <Box py={8} px={4} textAlign="center" borderRadius="sm" border="1px dashed" borderColor="ui.border" bg="blackAlpha.100">
                    <Text fontSize="10px" color="ui.muted" lineHeight="tall">
                        {lang === 'ko' ? "활성 연구 질문을 수립하여 분석 과정의 진화를 추적하세요." : "Establish active research questions to track your analytical evolution."}
                    </Text>
                </Box>
            )}
            
            {(hypotheses || []).map(h => {
                const isUnrelated = investigatingSignalId && h.linked_replay_checkpoint !== investigatingSignalId;
                return (
                <Box 
                    key={h.id} 
                    p={3} 
                    bg="blackAlpha.200" 
                    borderRadius="sm" 
                    borderLeft="3px solid" 
                    borderColor={getStatusColor(h.status) + ".500"}
                    opacity={isUnrelated ? 0.3 : 1}
                    transition="opacity 0.2s"
                >
                    <VStack align="stretch" spacing={2}>
                        <HStack justifyContent="space-between">
                            <HStack spacing={2}>
                                <Badge colorScheme={getStatusColor(h.status)} fontSize="8px" variant="solid" borderRadius="xs">{h.status.toUpperCase()}</Badge>
                                <Text fontSize="xs" fontWeight="bold" color="gray.200">{h.title}</Text>
                            </HStack>
                            <HStack spacing={1}>
                                {h.status === 'active' && (
                                    <>
                                        <Tooltip label={lang === 'ko' ? "검증 완료" : "Resolve as Validated"} fontSize="9px">
                                            <IconButton size="2xs" variant="ghost" colorScheme="green" icon={<CheckIcon w={2} h={2} />} onClick={() => handleResolve(h.id, 'resolved')} aria-label="Resolve" />
                                        </Tooltip>
                                        <Tooltip label={lang === 'ko' ? "미해결로 표시" : "Mark as Unresolved"} fontSize="9px">
                                            <IconButton size="2xs" variant="ghost" colorScheme="orange" icon={<InfoOutlineIcon w={2} h={2} />} onClick={() => handleResolve(h.id, 'unresolved')} aria-label="Unresolved" />
                                        </Tooltip>
                                    </>
                                )}
                                {h.status === 'resolved' && (
                                    <Tooltip label={lang === 'ko' ? "연구 결과로 승격" : "Promote to established finding"} fontSize="9px">
                                        <IconButton 
                                            size="2xs" 
                                            variant="ghost" 
                                            colorScheme="brand" 
                                            icon={<ArrowForwardIcon w={2} h={2} />} 
                                            onClick={() => handlePromoteToFinding(h)} 
                                            aria-label="Promote" 
                                        />
                                    </Tooltip>
                                )}
                            </HStack>
                        </HStack>
                        
                        <Text fontSize="11px" color="gray.400" lineHeight="1.6">{h.description}</Text>

                        {/* Related Findings Surface */}
                        <Box pt={2} borderTop="1px dashed" borderColor="whiteAlpha.100">
                          <Text fontSize="8px" color="brand.200" fontWeight="bold" mb={2}>{lang === 'ko' ? "관련 연구 결과" : "RELATED FINDINGS"}</Text>
                          <VStack align="stretch" spacing={2}>
                              {(() => {
                                  try {
                                      const raw = localStorage.getItem('pql_research_findings');
                                      const findings = JSON.parse(raw || '[]');
                                      const list = Array.isArray(findings) ? findings : [];
                                      const related = list.filter(f => 
                                          (Array.isArray(f.tags) && f.tags.some((t: string) => (h.tags || []).includes(t))) || 
                                          (h.title || '').includes(f.title || '') || 
                                          (f.title || '').includes(h.title || '')
                                      );

                                      if (related.length === 0) return <Text fontSize="8px" color="gray.600" fontStyle="italic">관련된 연구 결과가 없습니다.</Text>;

                                      return related.map(f => (
                                          <HStack key={f.id} p={1.5} bg="blackAlpha.300" borderRadius="xs" borderWidth="1px" borderColor="ui.border" justify="space-between">
                                              <VStack align="start" spacing={0}>
                                                  <Text fontSize="9px" fontWeight="bold" color="gray.300">{f.title || 'Untitled Finding'}</Text>
                                                  <Text fontSize="8px" color="ui.muted" noOfLines={1}>{f.observation || 'No observation recorded.'}</Text>
                                              </VStack>
                                              <Badge colorScheme={f.status === 'contradicted' ? 'orange' : 'brand'} fontSize="7px">{(f.status || 'ACTIVE').toUpperCase()}</Badge>
                                          </HStack>
                                      ));
                                  } catch (e) {
                                      return <Text fontSize="8px" color="gray.600" fontStyle="italic">데이터를 불러올 수 없습니다.</Text>;
                                  }
                              })()}
                          </VStack>
                        </Box>
                        
                        <Box pt={1}>
                            <HStack justify="space-between" mb={1}>
                                <Text fontSize="8px" color="ui.muted">{lang === 'ko' ? "신뢰도" : "CONFIDENCE"}</Text>
                                <Text fontSize="8px" color="ui.muted">{Math.round(h.confidence * 100)}%</Text>
                            </HStack>
                            <Progress value={h.confidence * 100} size="2xs" colorScheme={getStatusColor(h.status)} bg="blackAlpha.500" borderRadius="full" />
                        </Box>

                        <Divider borderColor="whiteAlpha.50" />
                        
                        <HStack justifyContent="space-between">
                            <HStack spacing={3}>
                                <HStack spacing={1}>
                                    <Icon as={TimeIcon} w={2.5} h={2.5} color="ui.muted" />
                                    <Text fontSize="9px" color="ui.muted">{new Date(h.timestamp).toLocaleDateString()}</Text>
                                </HStack>
                                {h.linked_session_id && (
                                    <HStack spacing={1}>
                                        <Icon as={LinkIcon} w={2.5} h={2.5} color="brand.500" />
                                        <Text fontSize="9px" color="brand.500" fontWeight="bold" letterSpacing="tighter">
                                            {lang === 'ko' ? "연결된 세션" : "LINKED SESSION"}
                                        </Text>
                                    </HStack>
                                )}
                            </HStack>
                        </HStack>
                    </VStack>
                </Box>
                );
            })}
          </VStack>
        </VStack>
      </Collapse>
    </Box>
  );
};

export default HypothesisManager;
