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
  Badge,
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
  const { lang, t } = useI18n();
  const [archives, setArchives] = useState<Archive[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<Archive | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const [newArchive, setNewArchive] = useState({ title: '', description: '' });
  const [importMode, setMode] = useState('merge');
  const toast = useToast();

  const fetchArchives = async () => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/archives`);
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
      toast({ title: lang === 'ko' ? '제목을 입력해주세요.' : 'Title required', status: 'warning' });
      return;
    }
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/archives/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArchive)
      });
      if (response.ok) {
        toast({ title: lang === 'ko' ? '상태가 보관되었습니다.' : 'State Archived', status: 'success' });
        fetchArchives();
        onClose();
        setNewArchive({ title: '', description: '' });
      }
    } catch (error) {
      toast({ title: 'Archiving failed', status: 'error' });
    }
  };

  const handleImport = async () => {
    if (!selectedArchive) return;
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/archives/${selectedArchive.archive_id}/import?mode=${importMode}`, {
        method: 'POST'
      });
      if (response.ok) {
        toast({ title: lang === 'ko' ? '연구 상태가 복원되었습니다.' : 'Research State Restored', description: `Successfully imported ${selectedArchive.title}`, status: 'success' });
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
        <VStack align="start" spacing={0}>
            <Text fontSize="10px" fontWeight="900" color="brand.500" letterSpacing="widest">{lang === 'ko' ? "연구 아카이브" : "RESEARCH ARCHIVES"}</Text>
            <Text fontSize="9px" color="ui.muted">{lang === 'ko' ? "상태 저장 이력" : "SAVED STATE HISTORY"}</Text>
        </VStack>
        <Button size="xs" variant="ghost" colorScheme="brand" leftIcon={<DownloadIcon />} onClick={onOpen} fontSize="9px" borderRadius="xs">
          {lang === 'ko' ? "보관" : "FREEZE"}
        </Button>
      </HStack>

      <List spacing={2}>
        {(archives || []).length === 0 ? (
          <Box py={4} textAlign="center" borderRadius="sm" border="1px dashed" borderColor="ui.border" bg="blackAlpha.100">
            <Text fontSize="9px" color="ui.muted" fontWeight="800">{lang === 'ko' ? "저장된 아카이브 없음" : "NO SAVED ARCHIVES"}</Text>
          </Box>
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
                    <Badge fontSize="8px" variant="ghost" color="brand.200" borderRadius="xs">{archive.session_count || 0} SESSIONS</Badge>
                  </HStack>
                </VStack>
                <HStack>
                    <IconButton 
                        size="xs" 
                        variant="ghost"
                        icon={<Icon as={InfoOutlineIcon} w={3} h={3} />} 
                        aria-label="Inspect Archive" 
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
          <ModalHeader fontSize="md" fontWeight="bold">{lang === 'ko' ? "연구 상태 보관" : "Freeze Research State"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Input 
                placeholder={lang === 'ko' ? "아카이브 제목..." : "Archive Title..."}
                fontSize="xs"
                bg="blackAlpha.300"
                borderColor="ui.border"
                value={newArchive.title}
                onChange={(e) => setNewArchive({ ...newArchive, title: e.target.value })}
              />
              <Textarea 
                placeholder={lang === 'ko' ? "현재 스냅샷에 대한 참고 사항..." : "Contextual notes for this snapshot..."}
                fontSize="xs"
                bg="blackAlpha.300"
                borderColor="ui.border"
                value={newArchive.description}
                onChange={(e) => setNewArchive({ ...newArchive, description: e.target.value })}
              />
              <Text fontSize="9px" color="ui.muted">
                {lang === 'ko' ? "현재의 모든 세션, 신호, 추적 기록을 포함하는 불변의 통합 패키지를 생성합니다." : "This creates an immutable, multi-layered package of all current sessions, signals, and evidence traces."}
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="ui.border">
            <Button size="sm" colorScheme="brand" onClick={handleCreateArchive}>{lang === 'ko' ? "상태 보관하기" : "Archive State"}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="background.surface" color="white" borderWidth="1px" borderColor="ui.border">
          <ModalHeader fontSize="md" fontWeight="bold">{lang === 'ko' ? "아카이브 탐색기" : "Archive Explorer"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedArchive && (
              <VStack align="stretch" spacing={5}>
                <Box>
                  <Text fontSize="9px" color="ui.muted" fontWeight="bold" mb={1}>ARCHIVE ID</Text>
                  <Text fontSize="xs" color="brand.200" fontFamily="mono">{selectedArchive.archive_id}</Text>
                </Box>
                <Box>
                  <Text fontSize="9px" color="ui.muted" fontWeight="bold" mb={2}>{lang === 'ko' ? "포함된 레이어" : "BUNDLED LAYERS"}</Text>
                  <HStack spacing={2} wrap="wrap">
                    {['SESSIONS', 'SIGNALS', 'FINDINGS', 'COMMENTS', 'REPLAYS', 'GOVERNANCE'].map(c => (
                      <Badge key={c} colorScheme="green" variant="subtle" fontSize="8px">{c}</Badge>
                    ))}
                  </HStack>
                </Box>
                <Box bg="blackAlpha.400" p={3} borderRadius="md" borderWidth="1px" borderColor="ui.border">
                  <Text fontSize="9px" color="ui.muted" fontWeight="bold" mb={2}>{lang === 'ko' ? "재현성 메타데이터" : "REPRODUCIBILITY METADATA"}</Text>
                  <HStack spacing={8}>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="9px" color="gray.600">{lang === 'ko' ? "스키마" : "SCHEMA"}</Text>
                      <Text fontSize="xs" fontWeight="bold">{selectedArchive.schema_version || '2.4.x'}</Text>
                    </VStack>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="9px" color="gray.600">{lang === 'ko' ? "리플레이 논리" : "REPLAY LOGIC"}</Text>
                      <Text fontSize="xs" fontWeight="bold">{selectedArchive.replay_version || 'v2-compat'}</Text>
                    </VStack>
                  </HStack>
                </Box>

                <Box>
                    <HStack justify="space-between" mb={2}>
                        <Text fontSize="10px" color="brand.200" fontWeight="bold">{lang === 'ko' ? "아카이브 내 주요 연구 결과" : "KEY FINDINGS IN ARCHIVE"}</Text>
                        <Badge fontSize="8px" variant="outline" colorScheme="brand">{lang === 'ko' ? "자동 감지됨" : "AUTO-SURFACED"}</Badge>
                    </HStack>
                    <VStack align="stretch" spacing={2}>
                        {(() => {
                            try {
                                const findings = JSON.parse(localStorage.getItem('pql_research_findings') || '[]');
                                const list = Array.isArray(findings) ? findings : [];
                                return list.slice(0, 3).map(f => (
                                    <Box key={f.id} p={2} bg="whiteAlpha.50" borderRadius="sm" borderLeft="2px solid" borderColor={f.status === 'contradicted' ? 'orange.500' : 'brand.500'}>
                                        <HStack justify="space-between">
                                            <Text fontSize="xs" fontWeight="bold" color="gray.200">{f.title || 'Untitled Finding'}</Text>
                                            <Badge colorScheme={f.status === 'contradicted' ? 'orange' : 'brand'}>{(f.status || 'ACTIVE').toUpperCase()}</Badge>
                                        </HStack>
                                        <Text fontSize="9px" color="ui.muted" noOfLines={1}>{f.observation || 'No observation recorded.'}</Text>
                                    </Box>
                                ));
                            } catch (e) {
                                return <Text fontSize="10px" color="ui.muted" fontStyle="italic">Unable to load findings.</Text>;
                            }
                        })()}
                    </VStack>
                </Box>
                
                <Box pt={2}>
                    <Text fontSize="9px" color="ui.muted" fontWeight="bold" mb={2}>{lang === 'ko' ? "복원 작업" : "RESTORE WORKFLOW"}</Text>
                    <HStack mb={3}>
                        <Select size="xs" bg="blackAlpha.300" borderColor="ui.border" value={importMode} onChange={(e) => setMode(e.target.value)}>
                            <option value="merge">{lang === 'ko' ? "기존 데이터와 병합 (권장)" : "Non-Destructive Layer Merge"}</option>
                            <option value="overwrite">{lang === 'ko' ? "전체 상태 덮어쓰기" : "Full State Overwrite"}</option>
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
                        {lang === 'ko' ? "연구 상태 복원" : "RESTORE RESEARCH STATE"}
                    </Button>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="ui.border">
            <Button size="sm" variant="ghost" onClick={onDetailClose}>{t('btn.close')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ResearchArchiveManager;
