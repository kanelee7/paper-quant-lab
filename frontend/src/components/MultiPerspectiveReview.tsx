import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Icon,
  Button,
  SimpleGrid,
  Divider,
  Avatar,
  AvatarGroup,
  Progress,
  Collapse,
  useDisclosure,
  IconButton,
} from '@chakra-ui/react';
import { 
  ChatIcon, 
  RepeatIcon, 
  ViewIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
} from '@chakra-ui/icons';

interface Perspective {
  author: string;
  narrative: string;
  confidence: number;
  timestamp: string;
  key_evidence_ids: string[];
}

const MultiPerspectiveReview: React.FC = () => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: false });
  const [perspectives, setPerspectives] = useState<Perspective[]>([]);
  const consensusScore = 0.65;

  useEffect(() => {
    // Simulated peer perspectives from shared archives/comments
    setPerspectives([
      {
        author: "Senior Analyst",
        narrative: "This regime shift is a classic distribution phase. The AI is correctly identifying the local top, but failing to see the macro-divergence in RSI.",
        confidence: 0.85,
        timestamp: "2024-05-16T14:30:00Z",
        key_evidence_ids: ["sig_01", "sig_02"]
      },
      {
        author: "Junior Researcher",
        narrative: "I interpret this as a high-volatility trap. The volume expansion suggests a breakout attempt, but the reasoning doesn't account for the previous rejection level.",
        confidence: 0.60,
        timestamp: "2024-05-17T09:15:00Z",
        key_evidence_ids: ["sig_02", "sig_03"]
      }
    ]);
  }, []);

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <HStack justifyContent="space-between" mb={2}>
        <HStack spacing={2}>
            <Heading size="xs" color="brand.500" letterSpacing="widest" textTransform="uppercase">Multi-Perspective Review</Heading>
            <AvatarGroup size="2xs" max={3}>
                {(perspectives || []).map(p => <Avatar key={p.author} name={p.author} />)}
            </AvatarGroup>
        </HStack>
        <IconButton 
          size="xs" 
          variant="ghost" 
          icon={isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />} 
          onClick={onToggle}
          aria-label="Toggle Perspectives"
        />
      </HStack>

      <Collapse in={isOpen}>
        <VStack align="stretch" spacing={4} mt={2}>
          <Box p={3} bg="blackAlpha.300" borderRadius="md" border="1px solid" borderColor="ui.border">
            <HStack justifyContent="space-between" mb={2}>
                <Text fontSize="10px" fontWeight="bold" color="ui.muted">ANALYTICAL CONSENSUS</Text>
                <Badge colorScheme="orange" fontSize="9px">DIVERGENT</Badge>
            </HStack>
            <Progress value={consensusScore * 100} size="xs" colorScheme="orange" bg="blackAlpha.500" borderRadius="full" />
            <Text fontSize="9px" color="ui.muted" mt={2}>Researchers are currently disagreeing on the primary regime driver.</Text>
          </Box>

          <SimpleGrid columns={1} spacing={3}>
            {(perspectives || []).map(p => (
                <Box key={p.author} p={3} bg="blackAlpha.200" borderRadius="md" borderLeft="3px solid" borderColor="blue.500">
                    <VStack align="stretch" spacing={2}>
                        <HStack justifyContent="space-between">
                            <HStack spacing={2}>
                                <Avatar size="2xs" name={p.author} />
                                <Text fontSize="xs" fontWeight="bold" color="gray.200">{p.author}</Text>
                            </HStack>
                            <Badge fontSize="8px" variant="outline">{new Date(p.timestamp).toLocaleDateString()}</Badge>
                        </HStack>
                        <Text fontSize="xs" color="gray.400" lineHeight="tall">{p.narrative}</Text>
                        <HStack justifyContent="space-between">
                            <HStack spacing={1}>
                                <Icon as={RepeatIcon} w={2} h={2} color="ui.muted" />
                                <Text fontSize="9px" color="ui.muted">{(Array.isArray(p.key_evidence_ids) ? p.key_evidence_ids.length : 0)} Evidence Links</Text>
                            </HStack>
                            <Button size="2xs" variant="ghost" colorScheme="blue" leftIcon={<ViewIcon />}>Sync Replay</Button>
                        </HStack>
                    </VStack>
                </Box>
            ))}
          </SimpleGrid>

          <Divider borderColor="ui.border" />
          
          <Button size="xs" colorScheme="brand" variant="outline" leftIcon={<ChatIcon />}>Initiate Analytical Debate</Button>
        </VStack>
      </Collapse>
    </Box>
  );
};

export default MultiPerspectiveReview;
