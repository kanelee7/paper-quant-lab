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
  Divider,
  List,
  ListItem,
  IconButton,
  useDisclosure,
  Progress,
  Collapse,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { 
  ChevronRightIcon, 
  ChevronDownIcon, 
  CheckCircleIcon, 
  InfoOutlineIcon,
  ArrowForwardIcon,
  RepeatIcon
} from '@chakra-ui/icons';

interface WorkflowStep {
  id: string;
  label: string;
  guidance: string;
}

interface WorkflowPreset {
  preset_id: string;
  title: string;
  description: string;
  recommended_mode: string;
  workflow_steps: WorkflowStep[];
}

interface ResearchWorkflowGuideProps {
  onModeChange: (mode: 'RESEARCH' | 'REVIEW' | 'TRAINING') => void;
}

const ResearchWorkflowGuide: React.FC<ResearchWorkflowGuideProps> = ({ onModeChange }) => {
  const [presets, setPresets] = useState<WorkflowPreset[]>([]);
  const [activePreset, setActivePreset] = useState<WorkflowPreset | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/workflows/presets');
      const data = await response.json();
      setPresets(data);
    } catch (error) {
      console.error('Failed to fetch presets:', error);
    }
  };

  const handleStartWorkflow = (preset: WorkflowPreset) => {
    setActivePreset(preset);
    setCurrentStepIndex(0);
    if (preset.recommended_mode) {
      onModeChange(preset.recommended_mode as any);
    }
  };

  const handleNextStep = () => {
    if (activePreset && currentStepIndex < activePreset.workflow_steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
        // Workflow complete
        setActivePreset(null);
    }
  };

  const handleReset = () => {
    setActivePreset(null);
    setCurrentStepIndex(0);
  };

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" borderLeft="4px solid" borderLeftColor="brand.500">
      <HStack justifyContent="space-between" mb={2}>
        <HStack spacing={2}>
            <Heading size="xs" color="brand.500" letterSpacing="widest" textTransform="uppercase">Guidance</Heading>
            {activePreset && <Badge colorScheme="brand" variant="solid" fontSize="9px">ACTIVE</Badge>}
        </HStack>
        <IconButton 
          size="xs" 
          variant="ghost" 
          icon={isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />} 
          onClick={onToggle}
          aria-label="Toggle Guide"
        />
      </HStack>

      <Collapse in={isOpen}>
        {!activePreset ? (
          <VStack align="stretch" spacing={3} mt={2}>
            <Text fontSize="11px" color="ui.muted">Execute a structured research pipeline.</Text>
            {presets.map(preset => (
              <Box 
                key={preset.preset_id} 
                p={2} 
                bg="blackAlpha.300" 
                borderRadius="md" 
                borderWidth="1px"
                borderColor="ui.border"
                cursor="pointer" 
                _hover={{ borderColor: 'brand.500', bg: 'whiteAlpha.50' }}
                onClick={() => handleStartWorkflow(preset)}
              >
                <HStack justifyContent="space-between" mb={1}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.200">{preset.title}</Text>
                  <Icon as={ArrowForwardIcon} w={3} h={3} color="brand.500" />
                </HStack>
                <Text fontSize="10px" color="ui.muted" noOfLines={1}>{preset.description}</Text>
              </Box>
            ))}
          </VStack>
        ) : (
          <VStack align="stretch" spacing={4} mt={2}>
            <Box>
                <HStack justifyContent="space-between" mb={2}>
                    <Text fontSize="xs" fontWeight="bold" color="brand.200">{activePreset.title}</Text>
                    <IconButton size="2xs" variant="ghost" icon={<RepeatIcon />} aria-label="Reset" onClick={handleReset} />
                </HStack>
                <Progress 
                    value={((currentStepIndex + 1) / activePreset.workflow_steps.length) * 100} 
                    size="xs" 
                    colorScheme="brand" 
                    bg="blackAlpha.500"
                    borderRadius="full" 
                />
            </Box>

            <Box p={3} bg="blackAlpha.300" borderRadius="md" borderLeft="2px solid" borderColor="brand.500">
                <HStack mb={1}>
                    <Badge colorScheme="brand" variant="subtle" fontSize="9px">STEP {currentStepIndex + 1}</Badge>
                    <Text fontSize="xs" fontWeight="bold" color="gray.100">{activePreset.workflow_steps[currentStepIndex].label}</Text>
                </HStack>
                <Text fontSize="11px" color="gray.400" fontStyle="italic" lineHeight="short">
                    {activePreset.workflow_steps[currentStepIndex].guidance}
                </Text>
            </Box>

            <Button 
                size="xs" 
                colorScheme="brand" 
                rightIcon={<ArrowForwardIcon />} 
                onClick={handleNextStep}
                borderRadius="sm"
            >
                {currentStepIndex === activePreset.workflow_steps.length - 1 ? 'Complete Pipeline' : 'Next Stage'}
            </Button>
          </VStack>
        )}
      </Collapse>
    </Box>
  );
};

export default ResearchWorkflowGuide;
