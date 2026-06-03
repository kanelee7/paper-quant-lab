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
  Checkbox,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Icon,
} from '@chakra-ui/react';
import { AddIcon, WarningIcon, InfoIcon } from '@chakra-ui/icons';

interface Review {
  review_id: string;
  title: string;
  summary: string;
  linked_sessions: string[];
  linked_insights: string[];
  key_findings: string[];
  failure_patterns: string[];
  created_at: string;
  review_scope: string;
  last_synthesis?: string;
  governance?: {
    evidence_coverage_score: number;
    reliability_flags: string[];
    audit_trail: {
      version: number;
      last_updated: string;
      synthesis_method: string;
    };
  };
}

const ResearchReviewBoard: React.FC = () => {
  const { t } = useI18n();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [contradictions, setContradictions] = useState<any[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [synthesisData, setSynthesisData] = useState<any>(null);
  const [governanceReport, setGovernanceReport] = useState<any>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  
  const [newReview, setNewReview] = useState({
    title: '',
    summary: '',
    linked_sessions: [] as string[],
    linked_insights: [] as string[]
  });
  
  const toast = useToast();

  const fetchReviews = async () => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/reviews`);
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const fetchContradictions = async () => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/reviews/contradictions`);
      const data = await response.json();
      setContradictions(data);
    } catch (error) {
      console.error('Failed to fetch contradictions:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/sessions`);
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/insights`);
      const data = await response.json();
      setInsights(data);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchSessions();
    fetchInsights();
    fetchContradictions();
  }, []);

  const handleCreateReview = async () => {
    if (!newReview.title || (Array.isArray(newReview.linked_sessions) && newReview.linked_sessions.length === 0)) {
      toast({ title: '제목과 최소 하나 이상의 세션 선택이 필요합니다.', status: 'warning' });
      return;
    }
    
    try {
      const sessionIds = (Array.isArray(newReview.linked_sessions) ? newReview.linked_sessions : []).join(',');
      const synthRes = await demoFetch(`${API_BASE_URL}/api/reviews/synthesis?session_ids=${sessionIds}`);
      const synthData = await synthRes.json();
      
      const response = await demoFetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newReview,
          summary: newReview.summary || synthData.summary,
          key_findings: (Object.entries(synthData.persona_stats || {}) || []).map(([pid, stats]: any) => 
            `${pid}: Win Rate ${stats.win_rate}%, Avg Return ${stats.avg_return}%`
          ),
          failure_patterns: synthData.frequent_failures
        })
      });
      
      if (response.ok) {
        toast({ title: '연구 보고서가 생성되었습니다.', status: 'success' });
        fetchReviews();
        fetchContradictions();
        onClose();
        setNewReview({ title: '', summary: '', linked_sessions: [], linked_insights: [] });
      }
    } catch (error) {
      toast({ title: '보고서 생성에 실패했습니다.', status: 'error' });
    }
  };

  const handleOpenDetail = async (review: Review) => {
    setSelectedReview(review);
    setSynthesisData(null);
    setGovernanceReport(null);
    onDetailOpen();
    
    try {
      const sessionIds = review.linked_sessions.join(',');
      const response = await demoFetch(`${API_BASE_URL}/api/reviews/synthesis?session_ids=${sessionIds}`);
      const data = await response.json();
      setSynthesisData(data);
      
      const govRes = await demoFetch(`${API_BASE_URL}/api/reviews/${review.review_id}/governance`);
      const govData = await govRes.json();
      setGovernanceReport(govData);
    } catch (error) {
      console.error('Failed to fetch synthesis or governance detail:', error);
    }
  };

  const toggleSessionSelection = (sessionId: string) => {
    if (newReview.linked_sessions.includes(sessionId)) {
      setNewReview({ ...newReview, linked_sessions: newReview.linked_sessions.filter(id => id !== sessionId) });
    } else {
      setNewReview({ ...newReview, linked_sessions: [...newReview.linked_sessions, sessionId] });
    }
  };

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <HStack justifyContent="space-between" mb={4}>
        <Heading size="xs" color="gray.400" letterSpacing="widest" textTransform="uppercase">{t('label.analysis_report')}</Heading>
        <IconButton 
          size="xs" 
          variant="ghost"
          colorScheme="brand" 
          aria-label="Add Review" 
          icon={<AddIcon />} 
          onClick={onOpen} 
        />
      </HStack>

      {contradictions.length > 0 && (
        <Box mb={4} p={2} bg="orange.900" borderRadius="md" border="1px solid" borderColor="orange.500">
            <HStack spacing={2}>
                <WarningIcon color="orange.300" w={3} h={3} />
                <VStack align="start" spacing={0}>
                    <Text fontSize="10px" fontWeight="bold" color="orange.100">
                        {contradictions.length}개의 분석 모순 발견
                    </Text>
                    <Text fontSize="8px" color="orange.200">실시간 품질 스캔 활성화 중.</Text>
                </VStack>
            </HStack>
        </Box>
      )}

      <VStack align="stretch" spacing={3}>
        {(reviews || []).length === 0 ? (
          <Text fontSize="11px" color="ui.muted" fontStyle="italic">아직 생성된 보고서가 없습니다.</Text>
        ) : (
          (reviews || []).map(review => (
            <Box 
              key={review.review_id} 
              p={3} 
              bg="blackAlpha.300" 
              borderRadius="md" 
              borderWidth="1px"
              borderColor="ui.border"
              borderLeft="3px solid" 
              borderLeftColor="brand.500"
              cursor="pointer"
              _hover={{ borderColor: 'brand.500', bg: 'whiteAlpha.50' }}
              onClick={() => handleOpenDetail(review)}
            >
              <HStack justifyContent="space-between" mb={1}>
                <Text fontWeight="bold" fontSize="xs" color="gray.200" noOfLines={1}>{review.title}</Text>
                <Badge fontSize="8px" colorScheme="brand" variant="outline">{review.review_scope}</Badge>
              </HStack>
              <Text fontSize="10px" color="ui.muted" mb={2} noOfLines={2}>{review.summary}</Text>
              <HStack justifyContent="space-between">
                <HStack spacing={2}>
                    <Text fontSize="9px" color="gray.600">감사: {new Date(review.created_at).toLocaleDateString()}</Text>
                    {review.governance && (
                        <Badge variant="ghost" colorScheme={review.governance.evidence_coverage_score > 0.7 ? "green" : "orange"} fontSize="8px">
                            신뢰도: {Math.round(review.governance.evidence_coverage_score * 100)}%
                        </Badge>
                    )}
                </HStack>
                <HStack spacing={1}>
                    {review.last_synthesis && (
                        <Text fontSize="8px" color="brand.200" fontStyle="italic">{Math.floor((Date.now() - new Date(review.last_synthesis).getTime()) / 3600000)}시간 전 업데이트됨</Text>
                    )}
                    <Badge fontSize="8px" variant="solid" colorScheme="blue" borderRadius="full">{(review.linked_sessions || []).length}</Badge>
                </HStack>
              </HStack>
            </Box>
          ))
        )}
      </VStack>

      {/* Review Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="background.surface" color="white" borderWidth="1px" borderColor="ui.border" borderRadius="xl">
          <ModalHeader fontSize="md" fontWeight="bold" borderBottomWidth="1px" borderColor="ui.border">종합 분석 보고서</ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            {selectedReview && (
              <VStack align="stretch" spacing={6}>
                <HStack justifyContent="space-between" p={3} bg="blackAlpha.400" borderRadius="md" borderWidth="1px" borderColor="ui.border">
                    <VStack align="start" spacing={0}>
                        <Text fontSize="10px" color="ui.muted" fontWeight="bold">품질 관리</Text>
                        <Text fontSize="9px" color="gray.600">Audit v{selectedReview.governance?.audit_trail?.version || 1}</Text>
                    </VStack>
                    {governanceReport && (
                        <HStack spacing={4}>
                            <VStack align="end" spacing={0}>
                                <Text fontSize="9px" color="ui.muted">커버리지</Text>
                                <Text fontSize="xs" fontWeight="bold" color={governanceReport.coverage_score > 0.7 ? "green.300" : "orange.300"}>
                                    {Math.round(governanceReport.coverage_score * 100)}%
                                </Text>
                            </VStack>
                            <Divider orientation="vertical" h="20px" borderColor="ui.border" />
                            <VStack align="end" spacing={0}>
                                <Text fontSize="9px" color="ui.muted">상태</Text>
                                <Badge colorScheme={(governanceReport.flags || []).length === 0 ? "green" : "red"} fontSize="9px" variant="solid">
                                    {(governanceReport.flags || []).length === 0 ? "STABLE" : "WEAK EVIDENCE"}
                                </Badge>
                            </VStack>
                        </HStack>
                    )}
                </HStack>

                <Box>
                  <Text fontSize="10px" color="ui.muted" fontWeight="bold" mb={2} textTransform="uppercase">핵심 요약</Text>
                  <Text fontSize="sm" lineHeight="relaxed" color="gray.200">{selectedReview.summary}</Text>
                </Box>

                {synthesisData && (
                  <>
                    <Box>
                      <Text fontSize="10px" color="ui.muted" fontWeight="bold" mb={3} textTransform="uppercase">기간별 분석 성과</Text>
                      <SimpleGrid columns={2} spacing={4}>
                        {(Object.entries(synthesisData.persona_stats || {}) || []).map(([pid, stats]: any) => (
                          <Box key={pid} p={3} bg="blackAlpha.300" borderRadius="md" borderTop="2px solid" borderTopColor="blue.500" borderWidth="1px" borderColor="ui.border">
                            <Text fontWeight="bold" fontSize="xs" mb={2} color="gray.100">{pid}</Text>
                            <HStack spacing={6}>
                              <Stat size="sm">
                                <StatLabel fontSize="9px" color="ui.muted">승률</StatLabel>
                                <StatNumber fontSize="xs" color="green.300">{stats.win_rate}%</StatNumber>
                              </Stat>
                              <Stat size="sm">
                                <StatLabel fontSize="9px" color="ui.muted">평균 수익</StatLabel>
                                <StatNumber fontSize="xs" color="blue.300">{stats.avg_return}%</StatNumber>
                              </Stat>
                            </HStack>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </Box>
                  </>
                )}

                <Box>
                  <Text fontSize="10px" color="ui.muted" fontWeight="bold" mb={2} textTransform="uppercase">근거 추적</Text>
                  <HStack wrap="wrap" spacing={2}>
                    {(selectedReview.linked_sessions || []).map(sid => (
                      <Badge key={sid} colorScheme="blue" variant="outline" fontSize="9px">세션: {sid.slice(-8)}</Badge>
                    ))}
                    {(selectedReview.linked_insights || []).map(iid => (
                      <Badge key={iid} colorScheme="purple" variant="outline" fontSize="9px">인사이트: {iid.slice(-8)}</Badge>
                    ))}
                  </HStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="ui.border">
            <Button size="sm" variant="ghost" onClick={onDetailClose}>{t('btn.close')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Review Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="background.surface" color="white" borderWidth="1px" borderColor="ui.border">
          <ModalHeader fontSize="md">보고서 생성</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Input 
                placeholder="보고서 제목..." 
                fontSize="sm"
                bg="blackAlpha.300"
                borderColor="ui.border"
                _focus={{ borderColor: 'brand.500' }}
                value={newReview.title}
                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
              />
              
              <Box>
                <Text fontSize="10px" fontWeight="bold" mb={2} color="ui.muted" textTransform="uppercase">세션 선택</Text>
                <Box maxH="150px" overflowY="auto" bg="blackAlpha.400" p={2} borderRadius="md" borderWidth="1px" borderColor="ui.border">
                  <List spacing={2}>
                    {(sessions || []).map(s => (
                      <ListItem key={s.session_id}>
                        <Checkbox 
                          colorScheme="brand" 
                          isChecked={newReview.linked_sessions.includes(s.session_id)}
                          onChange={() => toggleSessionSelection(s.session_id)}
                        >
                          <Text fontSize="xs" color="gray.300">{s.title}</Text>
                        </Checkbox>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Box>

              <Textarea 
                placeholder="분석 요약 (공란일 경우 자동 생성됨)..." 
                fontSize="sm"
                bg="blackAlpha.300"
                borderColor="ui.border"
                _focus={{ borderColor: 'brand.500' }}
                value={newReview.summary}
                onChange={(e) => setNewReview({ ...newReview, summary: e.target.value })}
              />
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="ui.border">
            <Button size="sm" colorScheme="brand" onClick={handleCreateReview}>생성하기</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ResearchReviewBoard;
