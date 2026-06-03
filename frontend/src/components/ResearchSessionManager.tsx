import React, { useState, useEffect } from 'react';
import { demoFetch } from "../demo/demoFetch";
import { API_BASE_URL } from '../config/api';
import { useI18n } from '../i18n';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Select,
  Tag,
  TagLabel,
  TagCloseButton,
  useToast,
  Badge,
  Divider,
  Textarea,
  List,
  ListItem,
  IconButton,
  SimpleGrid,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { 
  RepeatIcon, 
  SearchIcon,
  LinkIcon,
} from '@chakra-ui/icons';

interface Session {
  session_id: string;
  title: string;
  created_at: string;
  start_time?: string;
  end_time?: string;
  status: 'active' | 'completed';
  asset_type: string;
  market: string;
  personas: string[];
  notes: string;
  tags: string[];
  last_reviewed?: string;
  signal_count?: number;
}

const ResearchSessionManager: React.FC = () => {
  const { t } = useI18n();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [selectedSessionSummary, setSelectedSessionSummary] = useState<any>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newSession, setNewSession] = useState({
    title: '',
    asset_type: 'CRYPTO',
    market: 'BTC/USDT',
    personas: [] as string[],
    notes: '',
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState('');
  const toast = useToast();

  const fetchSessions = React.useCallback(async () => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/sessions`);
      const data = await response.json();
      setSessions(data);
      
      const active = data.find((s: Session) => s.status === 'active');
      setActiveSession(active || null);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleStartSession = async () => {
    if (!newSession.title) {
      toast({ title: '제목을 입력해주세요.', status: 'warning' });
      return;
    }
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession)
      });
      const data = await response.json();
      setActiveSession(data);
      fetchSessions();
      toast({ title: '연구 세션이 시작되었습니다.', status: 'success' });
    } catch (error) {
      toast({ title: '세션 시작에 실패했습니다.', status: 'error' });
    }
  };

  const handleStopSession = async () => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/sessions/stop`, { method: 'POST' });
      const stopped = await response.json();
      setActiveSession(null);
      fetchSessions();
      toast({ title: '연구 세션이 종료되었습니다.', status: 'info' });
      
      if (stopped && stopped.session_id) {
        handleViewSummary(stopped.session_id);
      }
    } catch (error) {
      toast({ title: '세션 종료에 실패했습니다.', status: 'error' });
    }
  };

  const handleViewSummary = async (sessionId: string) => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/sessions/${sessionId}/summary`);
      const data = await response.json();
      setSelectedSessionSummary(data);
      onOpen();
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const addTag = () => {
    if (newTag && !newSession.tags.includes(newTag)) {
      setNewSession({ ...newSession, tags: [...newSession.tags, newTag] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setNewSession({ ...newSession, tags: newSession.tags.filter(t => t !== tag) });
  };

  // Group archived sessions by market
  const archivedSessionsByMarket = sessions
    .filter(s => s.status === 'completed')
    .reduce((acc, s) => {
      if (!acc[s.market]) acc[s.market] = [];
      acc[s.market].push(s);
      return acc;
    }, {} as Record<string, Session[]>);

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <VStack align="start" spacing={0} mb={4}>
        <Text fontSize="10px" fontWeight="900" color="brand.500" letterSpacing="widest">연구 세션</Text>
        <Text fontSize="9px" color="ui.muted">활성 연구</Text>
      </VStack>
      
      {activeSession ? (
        <VStack align="stretch" spacing={3}>
          <Box p={4} bg="brand.900" borderRadius="md" borderLeft="4px solid" borderColor="brand.500" position="relative">
            <VStack align="stretch" spacing={3}>
                <HStack justifyContent="space-between">
                    <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" fontSize="sm" color="white">{activeSession.title}</Text>
                        <Text fontSize="10px" color="brand.200" fontWeight="700">진행 중</Text>
                    </VStack>
                    <Badge colorScheme="brand" variant="solid" fontSize="8px" px={2} borderRadius="xs">LIVE</Badge>
                </HStack>
                
                <SimpleGrid columns={2} spacing={2}>
                    <Box>
                        <Text fontSize="9px" color="ui.muted" fontWeight="800">시작 시간</Text>
                        <Text fontSize="10px" color="gray.300">{new Date(activeSession.start_time || activeSession.created_at).toLocaleTimeString()}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="9px" color="ui.muted" fontWeight="800">기록 수</Text>
                        <Text fontSize="10px" color="gray.300">{activeSession.signal_count || 0}개</Text>
                    </Box>
                </SimpleGrid>

                <Box p={2} bg="blackAlpha.400" borderRadius="xs" border="1px solid" borderColor="whiteAlpha.100">
                    <Text fontSize="9px" color="brand.500" fontWeight="900" mb={1}>다음 단계</Text>
                    <Text fontSize="10px" color="gray.100">
                        {activeSession.signal_count && activeSession.signal_count > 0 
                            ? "리플레이 패널에서 분석 추적 기록을 확인하세요." 
                            : "데이터를 대기 중입니다. 차트의 신호를 모니터링하세요."}
                    </Text>
                </Box>

                <HStack wrap="wrap" spacing={1}>
                {(activeSession.tags || []).map(tag => (
                    <Badge key={tag} variant="outline" fontSize="8px" colorScheme="brand" borderRadius="xs">{tag}</Badge>
                ))}
                </HStack>

                <Button size="xs" colorScheme="red" mt={1} w="100%" onClick={handleStopSession} fontSize="9px" borderRadius="sm" fontWeight="800">
                세션 종료 및 보관
                </Button>
            </VStack>
          </Box>
        </VStack>
      ) : (
        <VStack align="stretch" spacing={3}>
          <Input 
            placeholder="연구 제목" 
            size="xs" 
            value={newSession.title}
            onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
            bg="background.deep"
            borderColor="ui.border"
            borderRadius="sm"
          />
          <HStack spacing={2}>
            <Select 
              size="xs" 
              value={newSession.asset_type}
              onChange={(e) => setNewSession({ ...newSession, asset_type: e.target.value })}
              bg="background.deep"
              borderColor="ui.border"
              borderRadius="sm"
            >
              <option value="CRYPTO">가상자산 피드</option>
              <option value="STOCK">주식 피드</option>
            </Select>
            <Input 
              placeholder="분석 대상" 
              size="xs" 
              value={newSession.market}
              onChange={(e) => setNewSession({ ...newSession, market: e.target.value })}
              bg="background.deep"
              borderColor="ui.border"
              borderRadius="sm"
            />
          </HStack>
          <Textarea 
            placeholder="연구 목적 및 파라미터..." 
            size="xs" 
            value={newSession.notes}
            onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
            bg="background.deep"
            borderColor="ui.border"
            borderRadius="sm"
          />
          <HStack>
            <Input 
              placeholder="태그 (예: #추세)" 
              size="xs" 
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              bg="background.deep"
              borderColor="ui.border"
              borderRadius="sm"
            />
            <Button size="xs" onClick={addTag} colorScheme="brand" variant="outline" fontSize="9px" borderRadius="sm">추가</Button>
          </HStack>
          <HStack wrap="wrap">
            {(newSession.tags || []).map(tag => (
              <Tag key={tag} size="sm" colorScheme="brand" variant="subtle" borderRadius="xs">
                <TagLabel fontSize="9px">{tag}</TagLabel>
                <TagCloseButton onClick={() => removeTag(tag)} />
              </Tag>
            ))}
          </HStack>
          <Button size="xs" colorScheme="brand" onClick={handleStartSession} fontWeight="800" fontSize="10px" borderRadius="sm">
            연구 세션 시작
          </Button>
        </VStack>
      )}

      <Divider my={4} borderColor="ui.border" />
      
      <HStack justifyContent="space-between" mb={2}>
        <Text fontSize="10px" fontWeight="800" color="ui.muted" letterSpacing="widest">보관된 세션</Text>
        <Badge fontSize="8px" variant="outline" colorScheme="gray">{Object.keys(archivedSessionsByMarket).length}개 시장</Badge>
      </HStack>

      <Box maxH="300px" overflowY="auto" pr={1} sx={{ '&::-webkit-scrollbar': { width: '2px' }, '&::-webkit-scrollbar-thumb': { bg: 'whiteAlpha.100' } }}>
        <VStack align="stretch" spacing={4}>
          {Object.entries(archivedSessionsByMarket).map(([market, marketSessions]) => (
            <Box key={market}>
              <HStack spacing={2} mb={1} px={1}>
                <Icon as={RepeatIcon} w={2} h={2} color="brand.500" />
                <Text fontSize="9px" fontWeight="bold" color="brand.200">{market} 피드</Text>
                <Divider flex={1} borderColor="whiteAlpha.100" />
              </HStack>
              <List spacing={1.5}>
                {marketSessions.map(s => {
                  const sTags = Array.isArray(s.tags) ? s.tags : [];
                  const activeTags = activeSession && Array.isArray(activeSession.tags) ? activeSession.tags : [];
                  const isRelated = activeSession && (s.market === activeSession.market || sTags.some(t => activeTags.includes(t)));
                  return (
                    <ListItem 
                      key={s.session_id} 
                      p={2} 
                      bg="blackAlpha.300" 
                      borderRadius="md" 
                      borderWidth="1px" 
                      borderColor={isRelated ? "brand.900" : "ui.border"} 
                      _hover={{ borderColor: 'brand.500', bg: 'blackAlpha.400' }}
                      transition="all 0.2s"
                      position="relative"
                    >
                      <VStack align="stretch" spacing={1}>
                        <HStack justifyContent="space-between">
                          <VStack align="start" spacing={0} flex={1} cursor="pointer" onClick={() => handleViewSummary(s.session_id)}>
                            <HStack spacing={1}>
                                <Text fontSize="xs" fontWeight="bold" noOfLines={1} color="gray.200">{s.title}</Text>
                                {isRelated && (
                                    <Tooltip label="연관성 발견: 동일 시장/태그" fontSize="9px">
                                        <Icon as={LinkIcon} w={2} h={2} color="brand.500" />
                                    </Tooltip>
                                )}
                            </HStack>
                            <HStack spacing={2}>
                                <Text fontSize="9px" color="ui.muted">{new Date(s.end_time || s.created_at).toLocaleDateString()}</Text>
                                <Text fontSize="9px" color="ui.muted" borderLeft="1px solid" borderColor="whiteAlpha.100" pl={2}>
                                    기록 {s.signal_count || 0}개
                                </Text>
                            </HStack>
                          </VStack>
                          <IconButton 
                            size="2xs" 
                            variant="ghost"
                            icon={<SearchIcon w={2} h={2} />} 
                            aria-label="Inspect Archive" 
                            onClick={() => handleViewSummary(s.session_id)}
                          />
                        </HStack>
                        
                        <HStack wrap="wrap" spacing={1} mt={1}>
                            {sTags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="outline" fontSize="7px" px={1} colorScheme="gray" borderRadius="xs">{tag}</Badge>
                            ))}
                            {sTags.length > 3 && <Text fontSize="7px" color="ui.muted">+{sTags.length - 3}</Text>}
                        </HStack>
                      </VStack>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          ))}
          {Object.keys(archivedSessionsByMarket).length === 0 && (
            <Text fontSize="10px" color="ui.muted" fontStyle="italic" textAlign="center" py={4}>보관된 연구 세션이 없습니다.</Text>
          )}
        </VStack>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="background.surface" color="white" borderWidth="1px" borderColor="ui.border" borderRadius="md">
          <ModalHeader fontSize="md" fontWeight="bold">{t('label.session_summary')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedSessionSummary ? (
              <VStack align="stretch" spacing={4}>
                <Box p={3} bg="blackAlpha.400" borderRadius="md" borderLeft="2px solid" borderColor="brand.500">
                  <Text fontWeight="800" fontSize="9px" mb={2} color="ui.muted" letterSpacing="widest">요약</Text>
                  <Text fontSize="sm" lineHeight="relaxed">{selectedSessionSummary.summary}</Text>
                </Box>

                <SimpleGrid columns={2} gap={4}>
                  <Box p={3} bg="blackAlpha.300" borderRadius="md" borderWidth="1px" borderColor="ui.border">
                    <Text fontWeight="800" fontSize="9px" mb={2} color="ui.muted" letterSpacing="widest">주요 패턴</Text>
                    <HStack wrap="wrap" spacing={1}>
                      {(selectedSessionSummary.top_patterns || []).map((p: string) => (
                        <Badge key={p} colorScheme="brand" variant="outline" fontSize="9px">{p}</Badge>
                      ))}
                    </HStack>
                  </Box>
                  <Box p={3} bg="blackAlpha.300" borderRadius="md" borderWidth="1px" borderColor="ui.border">
                    <Text fontWeight="800" fontSize="9px" mb={2} color="ui.muted" letterSpacing="widest">빈번한 오류</Text>
                    <HStack wrap="wrap" spacing={1}>
                      {(selectedSessionSummary.frequent_failures || []).map((f: string) => (
                        <Badge key={f} colorScheme="red" variant="solid" fontSize="9px">{f}</Badge>
                      ))}
                    </HStack>
                  </Box>
                </SimpleGrid>

                <HStack justifyContent="space-between" p={3} bg="brand.900" borderRadius="md" color="brand.100">
                  <Text fontSize="xs" fontWeight="bold">가장 강한 추세:</Text>
                  <Badge colorScheme="brand" variant="solid" fontSize="10px">{(selectedSessionSummary.strongest_regime || '알 수 없음').toUpperCase()}</Badge>
                </HStack>

                <Box p={3} bg="blackAlpha.200" borderRadius="md" borderWidth="1px" borderColor="ui.border">
                    <HStack justify="space-between" mb={2}>
                        <Text fontWeight="800" fontSize="9px" color="ui.muted" letterSpacing="widest">데이터 출처</Text>
                        <Badge fontSize="8px" variant="outline">STABLE</Badge>
                    </HStack>
                    <SimpleGrid columns={2} spacing={2}>
                        <VStack align="start" spacing={0}>
                            <Text fontSize="8px" color="ui.muted">SESSION_ID</Text>
                            <Text fontSize="10px" color="gray.400" fontFamily="mono">{selectedSessionSummary.session_id?.slice(0, 12)}</Text>
                        </VStack>
                        <VStack align="start" spacing={0}>
                            <Text fontSize="8px" color="ui.muted">생성 일시</Text>
                            <Text fontSize="10px" color="gray.400">{new Date(selectedSessionSummary.generated_at).toLocaleString()}</Text>
                        </VStack>
                    </SimpleGrid>
                </Box>

                <Button 
                    size="sm" 
                    colorScheme="brand" 
                    variant="outline" 
                    leftIcon={<RepeatIcon />} 
                    fontSize="10px"
                    fontWeight="800"
                >
                    전체 세션 추적 리플레이
                </Button>
              </VStack>
            ) : (
              <Text fontSize="xs" color="ui.muted">요약 데이터를 불러오는 중...</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="ghost" onClick={onClose}>{t('btn.close')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ResearchSessionManager;
