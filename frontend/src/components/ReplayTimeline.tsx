import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Button,
  IconButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Badge,
  Divider,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Icon,
  Portal,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useToast,
} from '@chakra-ui/react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ArrowLeftIcon, 
  ArrowRightIcon,
  SearchIcon,
  TimeIcon,
  LinkIcon,
} from '@chakra-ui/icons';
import { demoFetch } from "../demo/demoFetch";
import { API_BASE_URL } from '../config/api';
import { useI18n } from '../i18n';
import { Hypothesis } from './HypothesisManager';

interface Signal {
  id: string;
  timestamp: string;
  action: 'buy' | 'sell' | 'hold';
  persona_id?: string;
  market_regime?: string;
  price: number;
  reason?: string;
  reasoning_trace?: string;
  strategy_name?: string;
}

interface ReplayTimelineProps {
  symbol: string;
  onFocusSignal: (signal: Signal) => void;
  investigatingSignalId?: string | null;
  onClearFocus?: () => void;
}

const ReplayTimeline: React.FC<ReplayTimelineProps> = ({ symbol, onFocusSignal, investigatingSignalId, onClearFocus }) => {
  const { lang, t } = useI18n();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [currentIndex, setCurrentStepIndex] = useState(-1);
  const [sliderValue, setSliderValue] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeHypotheses, setActiveHypotheses] = useState<Hypothesis[]>([]);
  const toast = useToast();

  const fetchSignals = useCallback(async () => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/journal?limit=200`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      const filtered = list.filter((s: any) => s.symbol === symbol).sort((a: any, b: any) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setSignals(filtered);
      if (filtered.length > 0) {
          setCurrentStepIndex(filtered.length - 1);
          setSliderValue(filtered.length - 1);
      }
    } catch (error) {
      console.error('Failed to fetch signals for timeline:', error);
    }
  }, [symbol]);

  useEffect(() => {
    fetchSignals();
    const saved = localStorage.getItem('pql_hypotheses');
    if (saved) {
        try {
            const hList = JSON.parse(saved);
            setActiveHypotheses((Array.isArray(hList) ? hList : []).filter((h: Hypothesis) => h.status === 'active'));
        } catch (e) {
            setActiveHypotheses([]);
        }
    }
  }, [fetchSignals]);

  const handleLinkHypothesis = (hypothesisId: string, signalId: string) => {
    const saved = localStorage.getItem('pql_hypotheses');
    if (saved) {
        const all = JSON.parse(saved);
        const updated = all.map((h: Hypothesis) => {
            if (h.id === hypothesisId) {
                return {
                    ...h,
                    linked_replay_checkpoint: signalId,
                    evolution: [...h.evolution, {
                        timestamp: new Date().toISOString(),
                        note: lang === 'ko' ? `리플레이 체크포인트 연결됨: ${signalId.slice(0, 8)}` : `Linked to replay checkpoint: ${signalId.slice(0, 8)}`
                    }]
                };
            }
            return h;
        });
        localStorage.setItem('pql_hypotheses', JSON.stringify(updated));
        toast({ title: lang === 'ko' ? '가설 연결됨' : 'Checkpoint Linked', status: 'success' });
    }
  };

  const handleExtractFinding = (signal: Signal) => {
    const finding = {
        id: `finding-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        title: lang === 'ko' ? `관찰: ${signal.strategy_name || '수동 추출'}` : `Observation: ${signal.strategy_name || 'Manual Extract'}`,
        observation: signal.reasoning_trace || signal.reason || 'Evidence extracted from replay trace.',
        related_signal_ids: [signal.id],
        related_session_ids: [],
        confidence: 0.7,
        status: 'active',
        supporting_evidence: `Replay checkpoint trace at ${new Date(signal.timestamp).toLocaleTimeString()}.`,
        tags: ['extracted', signal.market_regime || 'unknown']
    };
    
    const event = new CustomEvent('pql-add-finding', { detail: { type: 'FINDING', finding } });
    window.dispatchEvent(event);
  };

  const handleSliderChange = (val: number) => {
    setSliderValue(val);
    if (signals[val]) {
        setCurrentStepIndex(val);
        onFocusSignal(signals[val]);
    }
  };

  const jumpToPrevious = () => {
    if (currentIndex > 0) {
        handleSliderChange(currentIndex - 1);
    }
  };

  const jumpToNext = () => {
    if (currentIndex < signals.length - 1) {
        handleSliderChange(currentIndex + 1);
    }
  };

  if (signals.length === 0) return null;

  const currentSignal = signals[currentIndex];

  const getPriceDelta = (index: number) => {
    if (index <= 0) return null;
    const prev = signals[index - 1];
    const curr = signals[index];
    const delta = curr.price - prev.price;
    const pct = (delta / prev.price) * 100;
    return { delta, pct };
  };

  return (
    <Box 
        bg="background.surface" 
        p={3} 
        borderRadius="md" 
        borderWidth="1px" 
        borderColor="ui.border"
        boxShadow="panel"
    >
      <VStack spacing={4} align="stretch">
        <HStack justifyContent="space-between" px={2}>
            <HStack spacing={4}>
                <VStack align="start" spacing={0}>
                    <Text fontSize="10px" fontWeight="900" color="brand.500" letterSpacing="widest">{t('sidebar.reliability')}</Text>
                    <Text fontSize="9px" color="ui.muted">{t('label.trace_repository')}</Text>
                </VStack>
                <HStack spacing={1} bg="blackAlpha.400" p={1} borderRadius="sm" border="1px solid" borderColor="ui.border">
                    <IconButton 
                        size="2xs" 
                        variant="ghost" 
                        icon={<ArrowLeftIcon w={2} h={2} />} 
                        aria-label="Jump to Origin" 
                        onClick={() => handleSliderChange(0)} 
                    />
                    <IconButton 
                        size="2xs" 
                        variant="ghost" 
                        icon={<ChevronLeftIcon w={4} h={4} />} 
                        aria-label="Previous Evidence" 
                        onClick={jumpToPrevious} 
                    />
                    <Box px={2} borderLeft="1px solid" borderRight="1px solid" borderColor="whiteAlpha.100">
                        <Text fontSize="xs" fontWeight="bold" fontFamily="mono" color="gray.200">
                            {String(currentIndex + 1).padStart(3, '0')} / {String(signals.length).padStart(3, '0')}
                        </Text>
                    </Box>
                    <IconButton 
                      size="2xs" 
                      variant="ghost" 
                      icon={<ChevronRightIcon w={4} h={4} />} 
                      aria-label="Next Evidence" 
                      onClick={jumpToNext} 
                    />
                    <IconButton 
                      size="2xs" 
                      variant="ghost" 
                      icon={<ArrowRightIcon w={2} h={2} />} 
                      aria-label="Jump to Latest" 
                      onClick={() => handleSliderChange((signals || []).length - 1)} 
                    />
                    </HStack>
                    </HStack>

                    {currentSignal && (
                    <HStack spacing={3}>
                    <VStack align="end" spacing={0}>
                      <Badge colorScheme={currentSignal.action === 'buy' ? 'green' : currentSignal.action === 'sell' ? 'red' : 'gray'} variant="subtle" fontSize="9px" px={2}>
                          {(currentSignal.action || 'SIGNAL').toUpperCase()} @ {(currentSignal.price || 0).toLocaleString()}
                      </Badge>
                      <Text fontSize="8px" color="ui.muted" mt={0.5}>COORD: {(currentSignal.id || '').slice(0, 8)}</Text>
                    </VStack>
                    <Divider orientation="vertical" h="20px" borderColor="ui.border" />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="9px" fontWeight="800" color="gray.300">{new Date(currentSignal.timestamp).toLocaleTimeString()}</Text>
                      <Text fontSize="8px" color="ui.muted">{lang === 'ko' ? "추적 완료" : "TRACE CAPTURED"}</Text>
                    </VStack>
                    <IconButton 
                      size="xs" 
                      colorScheme="brand" 
                      variant="outline"
                      icon={<SearchIcon w={3} h={3} />} 
                      aria-label="Inspect Reasoning Trace" 
                      onClick={() => {
                          const event = new CustomEvent('open-signal-detail', { detail: { signalId: currentSignal.id } });
                          window.dispatchEvent(event);
                      }}
                    />
                    </HStack>
                    )}
                    </HStack>

                    <Box px={6} pt={4} pb={2} position="relative">
                    <Slider
                    aria-label="evidence-scrubber"
                    min={0}
                    max={(signals || []).length - 1}
                    step={1}
                    value={sliderValue}
                    onChange={handleSliderChange}
                    focusThumbOnChange={false}
                    >
                    <SliderTrack bg="blackAlpha.400" h="6px" borderRadius="full">
                    <SliderFilledTrack bg="brand.500" />
                    </SliderTrack>
                    {(signals || []).map((s, idx) => {
                    const deltaInfo = getPriceDelta(idx);
                    return (
                      <SliderMark
                          key={s.id}
                          value={idx}
                          mt='1'
                          ml='-0.5'
                      >
                          <Popover trigger="hover" placement="top" openDelay={200} isLazy>
                              <PopoverTrigger>
                                  <Box 
                                      w={idx === currentIndex ? "3px" : "1.5px"} 
                                      h={idx === currentIndex ? "12px" : "8px"} 
                                      bg={s.action === 'buy' ? 'green.400' : s.action === 'sell' ? 'red.400' : 'gray.400'} 
                                      opacity={idx === currentIndex ? 1 : hoveredIndex === idx ? 0.8 : 0.4}
                                      borderRadius="full"
                                      transition="all 0.2s"
                                      transform={idx === currentIndex ? "translateY(-2px)" : "none"}
                                      cursor="pointer"
                                      onMouseEnter={() => setHoveredIndex(idx)}
                                      onMouseLeave={() => setHoveredIndex(null)}
                                      onClick={() => handleSliderChange(idx)}
                                  />
                              </PopoverTrigger>
                              <Portal>
                                  <PopoverContent 
                                      bg="background.surface" 
                                      borderColor="ui.border" 
                                      boxShadow="panel" 
                                      w="240px" 
                                      p={3}
                                      borderRadius="md"
                                      _focus={{ boxShadow: 'panel' }}
                                  >
                                      <PopoverArrow bg="background.surface" />
                                      <PopoverBody p={0}>
                                          <VStack align="stretch" spacing={2}>
                                              <HStack justify="space-between">
                                                  <HStack spacing={1}>
                                                      <Icon as={TimeIcon} w={2} h={2} color="brand.500" />
                                                      <Text fontSize="9px" color="ui.muted" fontWeight="bold">
                                                          {new Date(s.timestamp).toLocaleTimeString()}
                                                      </Text>
                                                  </HStack>
                                                  <Badge fontSize="8px" colorScheme={s.action === 'buy' ? 'green' : s.action === 'sell' ? 'red' : 'gray'}>
                                                      {(s.action || '').toUpperCase()}
                                                  </Badge>
                                              </HStack>

                                              <VStack align="start" spacing={1}>
                                                  <Text fontSize="10px" color="gray.200" fontWeight="bold">
                                                      {lang === 'ko' ? "판단 요약" : "REASONING SNAPSHOT"}
                                                  </Text>
                                                  <Text fontSize="10px" color="gray.400" fontStyle="italic" noOfLines={2}>
                                                      "{s.reasoning_trace || s.reason || 'Observation trace captured.'}"
                                                  </Text>
                                              </VStack>

                                              <Divider borderColor="whiteAlpha.100" />

                                              <HStack justify="space-between">
                                                  <VStack align="start" spacing={0}>
                                                      <Text fontSize="8px" color="ui.muted">
                                                          {lang === 'ko' ? "상태 변화" : "STATE DELTA"}
                                                      </Text>
                                                      {deltaInfo ? (
                                                          <Text fontSize="10px" color={deltaInfo.delta >= 0 ? "green.300" : "red.300"} fontWeight="bold">
                                                              {deltaInfo.delta >= 0 ? '+' : ''}{deltaInfo.pct.toFixed(2)}%
                                                          </Text>
                                                      ) : (
                                                          <Text fontSize="10px" color="ui.muted">
                                                              {lang === 'ko' ? "기점" : "ORIGIN"}
                                                          </Text>
                                                      )}
                                                  </VStack>
                                                  <VStack align="end" spacing={0}>
                                                      <Menu>
                                                          <MenuButton as={Button} size="2xs" variant="outline" colorScheme="brand" rightIcon={<LinkIcon w={2} h={2} />} fontSize="8px">
                                                              {lang === 'ko' ? "가설 연결" : "LINK HYPOTHESIS"}
                                                          </MenuButton>
                                                          <MenuList bg="background.surface" borderColor="ui.border" p={1} boxShadow="panel" zIndex={2000}>
                                                              {(activeHypotheses || []).length === 0 ? (
                                                                  <MenuItem isDisabled fontSize="9px" bg="transparent">
                                                                      {lang === 'ko' ? "활성 가설 없음" : "No active hypotheses"}
                                                                  </MenuItem>
                                                              ) : (
                                                                  (activeHypotheses || []).map(h => (
                                                                      <MenuItem 
                                                                          key={h.id} 
                                                                          fontSize="9px" 
                                                                          bg="transparent" 
                                                                          _hover={{ bg: 'whiteAlpha.100' }}
                                                                          onClick={() => handleLinkHypothesis(h.id, s.id)}
                                                                      >
                                                                          {h.title}
                                                                      </MenuItem>
                                                                  ))
                                                              )}
                                                              <MenuDivider borderColor="whiteAlpha.100" />
                                                              <MenuItem 
                                                                  fontSize="9px" 
                                                                  bg="transparent" 
                                                                  color="brand.500"
                                                                  fontWeight="bold"
                                                                  _hover={{ bg: 'whiteAlpha.100' }}
                                                                  onClick={() => handleExtractFinding(s)}
                                                              >
                                                                  {lang === 'ko' ? "연구 결과로 추출" : "EXTRACT FINDING"}
                                                              </MenuItem>
                                                          </MenuList>
                                                          </Menu>
                                                  </VStack>
                                              </HStack>
                                          </VStack>
                                      </PopoverBody>
                                  </PopoverContent>
                              </Portal>
                          </Popover>
                      </SliderMark>
                    );
                    })}
                    <SliderThumb boxSize={4} bg="brand.500" borderWidth="2px" borderColor="background.deep" _focus={{ boxShadow: 'none' }} _active={{ transform: 'scale(1.2)' }}>
                    <Box color="background.deep" as={SearchIcon} w={2} h={2} />
                    </SliderThumb>
                    </Slider>
                    <HStack justifyContent="space-between" mt={4}>
                    <Text fontSize="8px" color="ui.muted" fontWeight="800">{lang === 'ko' ? "추적 시작" : "ORIGIN_TRACE"}</Text>
                    <Text fontSize="8px" color="ui.muted" fontWeight="800">{lang === 'ko' ? "최신 상태" : "LATEST_STATE"}</Text>
                    </HStack>
                    </Box>

                    {investigatingSignalId && currentSignal && investigatingSignalId === currentSignal.id && (
                    <Box mt={2} p={4} bg="blackAlpha.300" borderRadius="md" borderWidth="1px" borderColor="brand.500" position="relative">
                    <HStack justify="space-between" mb={3}>
                    <HStack>
                      <Badge colorScheme="brand" variant="solid" fontSize="10px">{lang === 'ko' ? "세밀 검사" : "INSPECTION"}</Badge>
                      <Text fontSize="10px" fontWeight="bold" color="gray.200">{currentSignal.strategy_name}</Text>
                    </HStack>
                    <Button size="xs" variant="ghost" colorScheme="red" onClick={onClearFocus} fontSize="9px">
                        {lang === 'ko' ? "검사 종료" : "CLOSE INSPECTION"}
                    </Button>
                    </HStack>
                    <VStack align="stretch" spacing={3}>
                    <Box>
                      <Text fontSize="8px" color="ui.muted" fontWeight="bold" mb={1}>{t('label.trace')}</Text>
                      <Text fontSize="xs" fontStyle="italic" color="blue.100" borderLeft="2px solid" borderColor="blue.500" pl={2}>
                          {currentSignal.reasoning_trace || currentSignal.reason}
                      </Text>
                    </Box>

                    {/* Related Findings Surface */}
                    <Box pt={2} borderTop="1px dashed" borderColor="whiteAlpha.100">
                      <Text fontSize="8px" color="brand.200" fontWeight="bold" mb={2}>{t('label.research_findings')}</Text>
                      <VStack align="stretch" spacing={2}>
                          {(() => {
                              try {
                                  const raw = localStorage.getItem('pql_research_findings');
                                  const findings = JSON.parse(raw || '[]');
                                  const list = Array.isArray(findings) ? findings : [];
                                  const related = list.filter(f => Array.isArray(f.related_signal_ids) && f.related_signal_ids.includes(currentSignal.id));
                                  
                                  if (related.length === 0) return <Text fontSize="9px" color="gray.600" fontStyle="italic">연결된 연구 결과가 없습니다.</Text>;

                                  return related.map(f => (
                                      <HStack key={f.id} p={2} bg="blackAlpha.400" borderRadius="sm" borderWidth="1px" borderColor="ui.border" justify="space-between">
                                          <VStack align="start" spacing={0}>
                                              <Text fontSize="10px" fontWeight="bold" color="gray.200">{f.title || 'Untitled Finding'}</Text>
                                              <Text fontSize="9px" color="ui.muted" noOfLines={1}>{f.observation || 'No observation.'}</Text>
                                          </VStack>
                                          <Badge colorScheme={f.status === 'contradicted' ? 'orange' : 'brand'} fontSize="8px">{(f.status || 'ACTIVE').toUpperCase()}</Badge>
                                      </HStack>
                                  ));
                              } catch (e) {
                                  return <Text fontSize="9px" color="gray.600" fontStyle="italic">데이터를 불러올 수 없습니다.</Text>;
                              }
                          })()}
                      </VStack>
                    </Box>

                    <HStack justify="space-between" pt={2} borderTop="1px solid" borderColor="whiteAlpha.100">
                      <HStack>
                          <Text fontSize="8px" color="ui.muted" fontWeight="bold">{lang === 'ko' ? "연결된 가설:" : "LINKED HYPOTHESES:"}</Text>
                          {(activeHypotheses || []).filter(h => h.linked_replay_checkpoint === currentSignal.id).length > 0 ? (
                              (activeHypotheses || []).filter(h => h.linked_replay_checkpoint === currentSignal.id).map(h => (
                                  <Badge key={h.id} variant="outline" colorScheme="blue" fontSize="8px">{h.title}</Badge>
                              ))
                          ) : (
                              <Text fontSize="9px" color="gray.500">{lang === 'ko' ? "없음" : "None"}</Text>
                          )}
                      </HStack>
                    </HStack>
                    </VStack>
                    </Box>
                    )}
      </VStack>
    </Box>
  );
};

export default ReplayTimeline;
