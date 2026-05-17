import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  VStack,
  HStack,
  Box,
  Heading,
  Badge,
  Icon,
  Progress,
} from '@chakra-ui/react';
import { 
  ChevronRightIcon, 
  ChevronLeftIcon, 
  CheckIcon, 
  InfoIcon,
  SearchIcon,
  RepeatIcon,
  ViewIcon
} from '@chakra-ui/icons';

interface OnboardingStep {
  title: string;
  description: string;
  icon: any;
  badge: string;
  color: string;
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to PaperQuantLab",
    description: "You are entering a local-first AI reasoning research workstation. This environment is designed for auditing AI analytical styles and synthesizing longitudinal market research through simulation.",
    icon: InfoIcon,
    badge: "LAB IDENTITY",
    color: "brand.500"
  },
  {
    title: "Research Mode",
    description: "The primary workspace for experimentation. Deploy AI personas, monitor real-time reasoning, and capture explainable signals across simulated market regimes.",
    icon: SearchIcon,
    badge: "EXPERIMENTATION",
    color: "blue.400"
  },
  {
    title: "Review Mode",
    description: "Transition here for post-mortem analysis. Compare multiple replay sessions side-by-side and synthesize raw evidence into structured research insights.",
    icon: ViewIcon,
    badge: "SYNTHESIS",
    color: "pink.400"
  },
  {
    title: "Training Mode",
    description: "A guided learning environment. Use narrated walkthroughs to understand complex market patterns and internalize AI analytical behaviors.",
    icon: RepeatIcon,
    badge: "LEARNING",
    color: "green.400"
  },
  {
    title: "Replay & Reliability",
    description: "Every decision is captured with a deterministic snapshot. Use the Replay Timeline to step back into any temporal context for deep audit and validation.",
    icon: RepeatIcon,
    badge: "DETERMINISM",
    color: "orange.400"
  }
];

const WorkspaceOnboarding: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('pql_onboarding_seen');
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('pql_onboarding_seen', 'true');
    setIsOpen(false);
  };

  const step = steps[currentStep];

  return (
    <Modal isOpen={isOpen} onClose={() => {}} size="lg" isCentered closeOnOverlayClick={false}>
      <ModalOverlay backdropFilter="blur(10px) grayscale(100%)" />
      <ModalContent borderLeft="4px solid" borderColor={step.color}>
        <ModalHeader borderBottomWidth="1px" borderColor="ui.border" pb={4}>
          <HStack spacing={3}>
            <Box p={2} bg="blackAlpha.300" borderRadius="md">
              <Icon as={step.icon} color={step.color} />
            </Box>
            <VStack align="start" spacing={0}>
              <Badge colorScheme={step.color.split('.')[0]} variant="subtle" mb={1}>{step.badge}</Badge>
              <Heading size="md" color="whiteAlpha.900">{step.title}</Heading>
            </VStack>
          </HStack>
        </ModalHeader>
        
        <ModalBody py={8}>
          <VStack align="stretch" spacing={6}>
            <Text fontSize="md" lineHeight="tall" color="gray.300">
              {step.description}
            </Text>
            
            <Box bg="blackAlpha.300" p={4} borderRadius="md" border="1px solid" borderColor="ui.border">
                <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2} textTransform="uppercase">Progressive Discovery</Text>
                <Progress 
                    value={((currentStep + 1) / steps.length) * 100} 
                    size="xs" 
                    colorScheme={step.color.split('.')[0]} 
                    bg="blackAlpha.500"
                    borderRadius="full" 
                />
                <HStack justifyContent="space-between" mt={2}>
                    <Text fontSize="10px" color="ui.muted">STEP {currentStep + 1} OF {steps.length}</Text>
                    <Text fontSize="10px" color="ui.muted">{Math.round(((currentStep + 1) / steps.length) * 100)}% COMPLETE</Text>
                </HStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor="ui.border" bg="blackAlpha.200">
          <HStack spacing={3} width="100%" justifyContent="space-between">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleComplete} 
                fontSize="xs"
                color="ui.muted"
            >
                Skip Onboarding
            </Button>
            
            <HStack spacing={3}>
                {currentStep > 0 && (
                    <Button 
                        size="sm" 
                        variant="outline" 
                        leftIcon={<ChevronLeftIcon />} 
                        onClick={handleBack}
                        fontSize="xs"
                    >
                        Back
                    </Button>
                )}
                <Button 
                    size="sm" 
                    colorScheme={step.color.split('.')[0]} 
                    rightIcon={currentStep === steps.length - 1 ? <CheckIcon /> : <ChevronRightIcon />} 
                    onClick={handleNext}
                    minW="120px"
                    fontSize="xs"
                >
                    {currentStep === steps.length - 1 ? "Start Researching" : "Next Principle"}
                </Button>
            </HStack>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default WorkspaceOnboarding;
