import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { 
  RepeatIcon, 
  ViewIcon, 
  SearchIcon,
  ArrowForwardIcon,
  TimeIcon
} from '@chakra-ui/icons';

interface WorkspaceWelcomeProps {
  onImportDemo: () => void;
  onNewResearch: () => void;
  onReviewEvidence: () => void;
}

const WelcomeCard: React.FC<{ 
  title: string; 
  description: string; 
  icon: any; 
  actionLabel: string; 
  onClick: () => void;
  colorScheme?: string;
}> = ({ title, description, icon, actionLabel, onClick, colorScheme = "brand" }) => (
  <Box 
    p={6} 
    bg="blackAlpha.300" 
    borderWidth="1px" 
    borderColor="ui.border" 
    borderRadius="sm"
    transition="all 0.2s"
    _hover={{ borderColor: 'brand.500', bg: 'blackAlpha.400' }}
  >
    <VStack align="start" spacing={4} h="100%">
      <Icon as={icon} w={6} h={6} color={`${colorScheme}.500`} />
      <Box flex={1}>
        <Heading size="xs" mb={2} textTransform="uppercase" letterSpacing="widest" color="gray.100">{title}</Heading>
        <Text fontSize="xs" color="ui.muted" lineHeight="tall">{description}</Text>
      </Box>
      <Button 
        size="xs" 
        colorScheme={colorScheme} 
        variant="outline" 
        rightIcon={<ArrowForwardIcon />} 
        onClick={onClick}
        w="100%"
        fontSize="10px"
        fontWeight="800"
        letterSpacing="wider"
        borderRadius="xs"
      >
        {actionLabel}
      </Button>
    </VStack>
  </Box>
);

const WorkspaceWelcome: React.FC<WorkspaceWelcomeProps> = ({ 
  onImportDemo, 
  onNewResearch, 
  onReviewEvidence 
}) => {
  return (
    <Box h="100%" display="flex" alignItems="center" justifyContent="center" position="relative" zIndex={5}>
      <VStack spacing={8} maxW="container.lg" w="100%" py={12}>
        <VStack spacing={2} textAlign="center">
          <Heading size="md" letterSpacing="tight" fontWeight="700" color="gray.100">
            Select a Starting Point
          </Heading>
          <Text fontSize="sm" color="ui.muted">
            Load an existing archive or initialize a new research session to begin.
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="100%">
          <WelcomeCard
            title="Load Historical Archive"
            description="Load a seeded research archive to explore replay, evidence traces, and AI reasoning behavior. Recommended for first-time use."
            icon={TimeIcon}
            actionLabel="LOAD ARCHIVE"
            onClick={onImportDemo}
          />
          <WelcomeCard
            title="Start Research Session"
            description="Initialize a fresh simulation for active analytical experimentation and signal capture."
            icon={SearchIcon}
            actionLabel="NEW RESEARCH RUN"
            onClick={onNewResearch}
          />
          <WelcomeCard
            title="Open Evidence Archive"
            description="Access your local research archives to review replay evidence, governance traces, and longitudinal findings."
            icon={ViewIcon}
            actionLabel="OPEN REVIEW WORKSPACE"
            onClick={onReviewEvidence}
            colorScheme="pink"
          />
        </SimpleGrid>

        <VStack spacing={3} p={4} bg="blackAlpha.300" borderRadius="sm" border="1px dashed" borderColor="ui.border" maxW="600px">
            <HStack spacing={2}>
                <Box w={2} h={2} bg="brand.500" borderRadius="full" />
                <Text fontSize="10px" fontWeight="800" letterSpacing="widest">SIMULATION MANDATE</Text>
            </HStack>
            <Text fontSize="10px" color="ui.muted" textAlign="center" lineHeight="tall">
                PaperQuantLab is an observability platform for AI reasoning research. 
                It does not execute live trades. All market data is utilized for research, 
                replay, and evidence synthesis within a simulation environment.
            </Text>
        </VStack>

        <Divider borderColor="ui.border" w="40px" />
        
        <HStack spacing={6} fontSize="xs" color="ui.muted">
            <HStack spacing={1}>
                <Icon as={RepeatIcon} w={3} h={3} />
                <Text fontWeight="700">Deterministic Replay</Text>
            </HStack>
            <HStack spacing={1}>
                <Icon as={SearchIcon} w={3} h={3} />
                <Text fontWeight="700">Reasoning Observability</Text>
            </HStack>
            <HStack spacing={1}>
                <Icon as={ViewIcon} w={3} h={3} />
                <Text fontWeight="700">Local-First Archive</Text>
            </HStack>
        </HStack>
      </VStack>
    </Box>
  );
};

export default WorkspaceWelcome;
