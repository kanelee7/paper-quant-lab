import React, { useState, useEffect } from 'react';
import { demoFetch } from "../demo/demoFetch";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  Badge,
  IconButton,
  Progress,
  Collapse,
  useToast,
  Icon,
  useDisclosure,
} from '@chakra-ui/react';
import { 
  ChevronRightIcon, 
  ChevronDownIcon, 
  ArrowForwardIcon,
  RepeatIcon,
} from '@chakra-ui/icons';

interface WalkthroughStep {
  step_id: string;
  label: string;
  timestamp: string;
  symbol: string;
  notes: string;
  regime_hint?: string;
}

interface Walkthrough {
  walkthrough_id: string;
  title: string;
  description: string;
  steps: WalkthroughStep[];
}

const GuidedWalkthrough: React.FC<{ workspaceMode: string }> = ({ workspaceMode }) => {
  const [walkthroughs, setWalkthroughs] = useState<Walkthrough[]>([]);
  const [activeWalkthrough, setActiveWalkthrough] = useState<Walkthrough | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  const toast = useToast();

  useEffect(() => {
    fetchWalkthroughs();
  }, []);

  const fetchWalkthroughs = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/walkthroughs/presets');
      const data = await response.json();
      setWalkthroughs(data);
    } catch (error) {
      console.error('Failed to fetch walkthroughs:', error);
    }
  };

  const handleStartWalkthrough = (w: Walkthrough) => {
    if (w.steps.length === 0) {
        toast({ title: 'Walkthrough is empty', status: 'warning' });
        return;
    }
    setActiveWalkthrough(w);
    setCurrentStepIdx(0);
    applyStep(w.steps[0]);
  };

  const applyStep = (step: WalkthroughStep) => {
    const event = new CustomEvent('focus-chart', {
        detail: { timestamp: new Date(step.timestamp).getTime() }
    });
    window.dispatchEvent(event);
  };

  const handleNextStep = () => {
    if (activeWalkthrough && currentStepIdx < activeWalkthrough.steps.length - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      applyStep(activeWalkthrough.steps[nextIdx]);
    } else {
      setActiveWalkthrough(null);
      toast({ title: 'Walkthrough Completed', status: 'success' });
    }
  };

  const handleReset = () => {
    setActiveWalkthrough(null);
    setCurrentStepIdx(0);
  };

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" borderLeft="4px solid" borderLeftColor="green.500" shadow="sm">
      <HStack justifyContent="space-between" mb={2}>
        <HStack spacing={2}>
            <Heading size="xs" color="green.400" letterSpacing="widest" textTransform="uppercase">Walkthroughs</Heading>
            {activeWalkthrough && <Badge colorScheme="green" variant="solid" fontSize="9px">LIVE</Badge>}
        </HStack>
        <IconButton 
          size="xs" 
          variant="ghost" 
          icon={isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />} 
          onClick={onToggle}
          aria-label="Toggle Walkthrough"
        />
      </HStack>

      <Collapse in={isOpen}>
        {!activeWalkthrough ? (
          <VStack align="stretch" spacing={3} mt={4}>
            <Text fontSize="11px" color="ui.muted">Select a guided analytical story to begin.</Text>
            {(walkthroughs || []).map(w => (
              <Box 
                key={w.walkthrough_id} 
                p={2} 
                bg="blackAlpha.300" 
                borderRadius="md" 
                borderWidth="1px"
                borderColor="ui.border"
                cursor="pointer" 
                _hover={{ borderColor: 'brand.500', bg: 'whiteAlpha.50' }}
                onClick={() => handleStartWalkthrough(w)}
              >
                <HStack justifyContent="space-between" mb={1}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.200">{w.title}</Text>
                  <Icon as={ArrowForwardIcon} w={3} h={3} color="green.400" />
                </HStack>
                <Text fontSize="10px" color="ui.muted" noOfLines={1}>{w.description}</Text>
              </Box>
            ))}
          </VStack>
        ) : (
          <VStack align="stretch" spacing={4} mt={2}>
            <Box>
                <HStack justifyContent="space-between" mb={2}>
                    <Text fontSize="xs" fontWeight="bold" color="green.200">{activeWalkthrough.title}</Text>
                    <IconButton size="2xs" variant="ghost" icon={<RepeatIcon />} aria-label="Reset" onClick={handleReset} />
                </HStack>
                <Progress 
                    value={((currentStepIdx + 1) / activeWalkthrough.steps.length) * 100} 
                    size="xs" 
                    colorScheme="green" 
                    bg="blackAlpha.500"
                    borderRadius="full" 
                />
            </Box>

            <Box p={3} bg="blackAlpha.300" borderRadius="md" borderLeft="2px solid" borderColor="green.500">
                <HStack mb={1}>
                    <Badge colorScheme="green" variant="subtle" fontSize="9px">STEP {currentStepIdx + 1}</Badge>
                    <Text fontSize="xs" fontWeight="bold" color="gray.100">{activeWalkthrough.steps[currentStepIdx].label}</Text>
                </HStack>
                <Text fontSize="11px" color="gray.400" fontStyle="italic" lineHeight="short" mb={2}>
                    {activeWalkthrough.steps[currentStepIdx].notes}
                </Text>
                {activeWalkthrough.steps[currentStepIdx].regime_hint && (
                    <Badge fontSize="8px" colorScheme="blue" variant="outline">
                        REGIME: {activeWalkthrough.steps[currentStepIdx].regime_hint?.toUpperCase()}
                    </Badge>
                )}
            </Box>

            <Button 
                size="xs" 
                colorScheme="green" 
                rightIcon={<ArrowForwardIcon />} 
                onClick={handleNextStep}
                borderRadius="sm"
            >
                {currentStepIdx === activeWalkthrough.steps.length - 1 ? 'End Walkthrough' : 'Continue Narrative'}
            </Button>
          </VStack>
        )}
      </Collapse>
    </Box>
  );
};

export default GuidedWalkthrough;
