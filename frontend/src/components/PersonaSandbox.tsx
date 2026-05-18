import React, { useState, useEffect } from 'react';
import { demoFetch } from "../demo/demoFetch";
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
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/personas');
      const data = await response.json();
      setPersonas(data);
      setSelectedPersonas((data || []).map((p: Persona) => p.persona_id));
    } catch (error) {
      console.error('Failed to fetch personas:', error);
    }
  };

  const getPersonaHint = (personaId: string) => {
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
        title: '선택된 페르소나 없음',
        description: '분석을 실행할 페르소나를 하나 이상 선택해주세요.',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await demoFetch('http://localhost:8000/api/persona-analysis', {
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
          title: workspaceMode === 'TRAINING' ? 'Reasoning Generated' : 'Persona Analysis Complete',
          description: `${data.signals.length} signals generated for your review.`,
          status: 'success',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error during analysis',
        description: 'Failed to communicate with the server.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Box p={4} borderRadius="lg" bg="gray.800" color="white" borderWidth="1px" borderColor="gray.700">
      <VStack align="stretch" spacing={4}>
        <HStack justifyContent="space-between">
          <HStack>
            <Heading size="sm">{workspaceMode === 'TRAINING' ? 'Learn Analytical Styles' : 'Persona Sandbox'}</Heading>
            {workspaceMode === 'TRAINING' && <Badge colorScheme="green" fontSize="2xs">TRAINING</Badge>}
          </HStack>
          <Tooltip label="다양한 페르소나가 현재 시장 상황을 어떻게 해석하는지 실험합니다.">
            <InfoOutlineIcon color="gray.400" />
          </Tooltip>
        </HStack>
        
        <Text fontSize="xs" color="gray.400">
          {workspaceMode === 'TRAINING' 
            ? 'Select personas to see how different "brains" interpret current market data.' 
            : `Run independent analysis for ${symbol} using selected AI personas.`}
        </Text>

        <Divider borderColor="gray.600" />

        <CheckboxGroup 
          colorScheme="blue" 
          value={selectedPersonas} 
          onChange={(values) => setSelectedPersonas(values as string[])}
        >
          <VStack align="stretch" spacing={2}>
            {(personas || []).map((persona) => (
              <Box 
                key={persona.persona_id} 
                p={2} 
                borderWidth="1px" 
                borderRadius="md" 
                borderColor={selectedPersonas.includes(persona.persona_id) ? 'blue.400' : 'gray.700'}
                bg={selectedPersonas.includes(persona.persona_id) ? 'gray.900' : 'transparent'}
              >
                <Checkbox value={persona.persona_id} size="sm">
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold" fontSize="xs">{persona.name}</Text>
                    {workspaceMode === 'TRAINING' ? (
                        <Text fontSize="2xs" color="green.300" fontStyle="italic">{getPersonaHint(persona.persona_id)}</Text>
                    ) : (
                        <Text fontSize="2xs" noOfLines={1} color="gray.400">{persona.description}</Text>
                    )}
                  </VStack>
                </Checkbox>
              </Box>
            ))}
          </VStack>
        </CheckboxGroup>

        <Button 
          colorScheme={workspaceMode === 'TRAINING' ? 'green' : 'blue'} 
          size="sm" 
          onClick={handleRunAnalysis} 
          isLoading={isAnalyzing}
          loadingText="Generating analysis..."
        >
          {workspaceMode === 'TRAINING' ? 'Run Comparative Review' : 'Execute Persona Analysis'}
        </Button>
      </VStack>
    </Box>
  );
};

export default PersonaSandbox;
