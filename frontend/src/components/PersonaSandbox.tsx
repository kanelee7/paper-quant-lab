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
  Checkbox,
  CheckboxGroup,
  useToast,
  Divider,
  Badge,
  SimpleGrid,
  Tooltip,
  Spinner,
} from '@chakra-ui/react';
import { InfoOutlineIcon } from '@chakra-ui/icons';

interface Persona {
  persona_id: string;
  name: string;
  description: string;
  reasoning_style: string;
  risk_preference: string;
  strategy_mapping: string;
  bias_tendencies: string[];
}

interface PersonaSandboxProps {
  symbol: string;
  workspaceMode?: 'RESEARCH' | 'REVIEW' | 'TRAINING';
}

const PersonaSandbox: React.FC<PersonaSandboxProps> = ({ symbol, workspaceMode = 'RESEARCH' }) => {
  const { lang, t } = useI18n();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/personas`);
      const data = await response.json();
      setPersonas(data);
      setSelectedPersonas((data || []).map((p: Persona) => p.persona_id));
    } catch (error) {
      console.error('Failed to fetch personas:', error);
    }
  };

  const getPersonaHint = (personaId: string) => {
    if (lang === 'ko') {
        switch(personaId) {
            case 'conservative_analyst': return '행동이 느리고, 거래를 신뢰하기 위해 여러 신호가 필요합니다.';
            case 'momentum_trader': return '큰 흐름을 타는 것을 좋아하며, 진입이 다소 늦을 수 있습니다.';
            case 'contrarian_trader': return '고점과 저점을 찾으며, 대중과 반대로 배팅합니다.';
            case 'risk_manager': return '위험이 매우 낮지 않으면 대부분 거절합니다.';
            default: return '독립적인 분석 스타일입니다.';
          }
    }
    switch(personaId) {
      case 'conservative_analyst': return 'Slow to act, needs multiple signs to trust a trade.';
      case 'momentum_trader': return 'Likes to ride big waves, might enter late.';
      case 'contrarian_trader': return 'Looking for tops and bottoms, bets against the crowd.';
      case 'risk_manager': return 'Mostly says NO unless risk is very low.';
      default: return 'Independent analysis style.';
    }
  };

  const handleRunAnalysis = async () => {
    if (selectedPersonas.length === 0) {
      toast({
        title: lang === 'ko' ? '선택된 페르소나 없음' : 'No personas selected',
        description: lang === 'ko' ? '분석을 실행할 페르소나를 하나 이상 선택해주세요.' : 'Please select at least one persona to analyze.',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await demoFetch(`${API_BASE_URL}/api/persona-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbol,
          persona_ids: selectedPersonas,
        }),
      });


      const data = await response.json();
      if (data.status === 'success') {
        toast({
          title: lang === 'ko' ? (workspaceMode === 'TRAINING' ? '판단 결과 생성됨' : '분석 완료') : (workspaceMode === 'TRAINING' ? 'Reasoning Generated' : 'Persona Analysis Complete'),
          description: lang === 'ko' ? `${data.signals.length}개의 신호가 생성되었습니다.` : `${data.signals.length} signals generated for your review.`,
          status: 'success',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: lang === 'ko' ? '분석 중 오류 발생' : 'Error during analysis',
        description: lang === 'ko' ? '서버 통신에 실패했습니다.' : 'Failed to communicate with the server.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Box p={4} borderRadius="sm" bg="background.surface" color="white" borderWidth="1px" borderColor="ui.border">
      <VStack align="stretch" spacing={4}>
        <HStack justifyContent="space-between">
          <HStack spacing={2}>
            <Heading size="xs" color="brand.500" letterSpacing="widest" textTransform="uppercase">
                {lang === 'ko' ? (workspaceMode === 'TRAINING' ? '비교 분석 관찰' : '분석 스타일') : (workspaceMode === 'TRAINING' ? 'Comparative Observation' : 'Analytical Personas')}
            </Heading>
            {workspaceMode === 'TRAINING' && <Badge colorScheme="green" variant="subtle" fontSize="9px">TRAINING MODE</Badge>}
          </HStack>
          <Tooltip label="Evaluate how different analytical profiles interpret current market conditions.">
            <InfoOutlineIcon color="ui.muted" w={3} h={3} />
          </Tooltip>
        </HStack>
        
        <Text fontSize="11px" color="ui.muted">
          {lang === 'ko' ? (
            workspaceMode === 'TRAINING' 
                ? '현재 시장 데이터에 대한 다양한 판단 패턴을 관찰할 프로필을 선택하세요.' 
                : `${symbol}에 대해 선택한 프로필들의 판단력을 비교 분석합니다.`
          ) : (
            workspaceMode === 'TRAINING' 
                ? 'Select profiles to observe diverse reasoning patterns for current market data.' 
                : `Initialize reasoning comparison for ${symbol} across selected profiles.`
          )}
        </Text>

        <Divider borderColor="ui.border" />

        <CheckboxGroup 
          colorScheme="brand" 
          value={selectedPersonas} 
          onChange={(values) => setSelectedPersonas(values as string[])}
        >
          <VStack align="stretch" spacing={2}>
            {(personas || []).map((persona) => (
              <Box 
                key={persona.persona_id} 
                p={2} 
                borderWidth="1px" 
                borderRadius="sm" 
                borderColor={selectedPersonas.includes(persona.persona_id) ? 'brand.500' : 'ui.border'}
                bg={selectedPersonas.includes(persona.persona_id) ? 'blackAlpha.300' : 'transparent'}
              >
                <Checkbox value={persona.persona_id} size="sm">
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="800" fontSize="10px" color={selectedPersonas.includes(persona.persona_id) ? 'brand.200' : 'gray.400'} textTransform="uppercase">{persona.name}</Text>
                    {workspaceMode === 'TRAINING' ? (
                        <Text fontSize="10px" color="brand.500" fontStyle="italic">{getPersonaHint(persona.persona_id)}</Text>
                    ) : (
                        <Text fontSize="10px" noOfLines={1} color="ui.muted">{persona.description}</Text>
                    )}
                  </VStack>
                </Checkbox>
              </Box>
            ))}
          </VStack>
        </CheckboxGroup>

        <Button 
          colorScheme="brand" 
          size="xs" 
          onClick={handleRunAnalysis} 
          isLoading={isAnalyzing}
          loadingText={lang === 'ko' ? "생성 중..." : "Generating..."}
          borderRadius="sm"
          fontWeight="800"
          fontSize="10px"
          letterSpacing="wider"
        >
          {lang === 'ko' 
            ? (workspaceMode === 'TRAINING' ? '비교 분석 시작' : '판단력 비교 분석 시작')
            : (workspaceMode === 'TRAINING' ? 'INITIATE COMPARATIVE REVIEW' : 'INITIALIZE REASONING COMPARISON')}
        </Button>
      </VStack>
    </Box>
  );
};

export default PersonaSandbox;
