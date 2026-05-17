import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Icon,
  Button,
  Collapse,
  useDisclosure,
  Progress,
} from '@chakra-ui/react';
import { 
  ChevronRightIcon, 
  ChevronDownIcon, 
  StarIcon,
  InfoIcon,
  TimeIcon
} from '@chakra-ui/icons';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  steps: number;
  icon: any;
  color: string;
}

const paths: LearningPath[] = [
  {
    id: 'replay_basics',
    title: "Understanding Replay Analysis",
    description: "Master the deterministic replay engine to audit past AI reasoning with sub-second precision.",
    difficulty: "Beginner",
    steps: 4,
    icon: TimeIcon,
    color: "blue.400"
  },
  {
    id: 'regime_interpretation',
    title: "Regime Interpretation Basics",
    description: "Learn to identify and categorize market regimes (Sideways, Volatile, Trending) through AI indicators.",
    difficulty: "Intermediate",
    steps: 6,
    icon: InfoIcon,
    color: "orange.400"
  },
  {
    id: 'persona_comparison',
    title: "Persona Comparison Studies",
    description: "Conduct side-by-side studies of divergent AI analytical styles in conflicting market contexts.",
    difficulty: "Advanced",
    steps: 5,
    icon: StarIcon,
    color: "purple.400"
  }
];

const LearningPathManager: React.FC = () => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  const [activePath, setActivePath] = useState<string | null>(null);

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" borderLeft="4px solid" borderLeftColor="brand.500" shadow="sm">
      <HStack justifyContent="space-between" mb={2}>
        <HStack spacing={2}>
            <Heading size="xs" color="brand.500" letterSpacing="widest" textTransform="uppercase">Learning Paths</Heading>
            <Badge colorScheme="brand" variant="subtle" fontSize="9px">NEW</Badge>
        </HStack>
        <IconButton 
          size="xs" 
          variant="ghost" 
          icon={isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />} 
          onClick={onToggle}
          aria-label="Toggle Learning Paths"
        />
      </HStack>

      <Collapse in={isOpen}>
        <VStack align="stretch" spacing={3} mt={2}>
          <Text fontSize="11px" color="ui.muted">Structured journeys for internalizing AI analytical styles.</Text>
          
          {paths.map(path => (
            <Box 
              key={path.id} 
              p={3} 
              bg="blackAlpha.300" 
              borderRadius="md" 
              borderWidth="1px"
              borderColor={activePath === path.id ? path.color : "ui.border"}
              cursor="pointer" 
              _hover={{ borderColor: path.color, bg: "whiteAlpha.50" }}
              onClick={() => setActivePath(activePath === path.id ? null : path.id)}
            >
              <VStack align="stretch" spacing={2}>
                <HStack justifyContent="space-between">
                  <HStack spacing={2}>
                    <Icon as={path.icon} color={path.color} w={3} h={3} />
                    <Text fontSize="xs" fontWeight="bold" color="gray.200">{path.title}</Text>
                  </HStack>
                  <Badge fontSize="8px" variant="outline" colorScheme={path.difficulty === 'Beginner' ? 'green' : path.difficulty === 'Intermediate' ? 'orange' : 'purple'}>
                    {path.difficulty}
                  </Badge>
                </HStack>
                
                <Text fontSize="10px" color="ui.muted" noOfLines={2}>{path.description}</Text>
                
                {activePath === path.id && (
                    <Box pt={2}>
                        <VStack align="stretch" spacing={2}>
                            <HStack justifyContent="space-between">
                                <Text fontSize="9px" color="gray.500">CURRICULUM PROGRESS</Text>
                                <Text fontSize="9px" color="gray.500">0 / {path.steps} STEPS</Text>
                            </HStack>
                            <Progress value={0} size="2xs" colorScheme={path.color.split('.')[0]} bg="blackAlpha.500" borderRadius="full" />
                            <Button size="2xs" colorScheme={path.color.split('.')[0]} variant="solid" mt={1}>Resume Journey</Button>
                        </VStack>
                    </Box>
                )}
              </VStack>
            </Box>
          ))}
        </VStack>
      </Collapse>
    </Box>
  );
};

// Internal IconButton to avoid external import issues if any
const IconButton: React.FC<any> = (props) => {
    const { icon, onClick, ...rest } = props;
    return (
        <Box 
            as="button" 
            onClick={onClick} 
            p={1} 
            borderRadius="md" 
            _hover={{ bg: "whiteAlpha.100" }} 
            display="flex" 
            alignItems="center" 
            justifyContent="center"
            {...rest}
        >
            {icon}
        </Box>
    );
}

export default LearningPathManager;
