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
  Collapse,
  useDisclosure,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Divider,
} from '@chakra-ui/react';
import { 
  ChevronRightIcon, 
  ChevronDownIcon, 
  SearchIcon,
  LinkIcon,
  TimeIcon,
  StarIcon
} from '@chakra-ui/icons';

interface DiscoveryItem {
  id: string;
  type: 'Replay' | 'Session' | 'Pattern';
  title: string;
  timestamp?: string;
  relevance: number;
}

const ResearchDiscovery: React.FC = () => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<DiscoveryItem[]>([]);
  
  useEffect(() => {
    // Mock discovery logic based on recent activity
    setSuggestions([
      { id: '1', type: 'Replay', title: 'BTC/USDT Volatility Spike (05/14)', timestamp: '2024-05-14T10:15:00Z', relevance: 0.95 },
      { id: '2', type: 'Session', title: 'Momentum Breakdown Study', relevance: 0.88 },
      { id: '3', type: 'Pattern', title: 'Fake Breakout Archetype', relevance: 0.82 },
    ]);
  }, []);

  const handleShowReplay = (timestamp: string) => {
    const event = new CustomEvent('focus-chart', {
      detail: { timestamp: new Date(timestamp).getTime() }
    });
    window.dispatchEvent(event);
  };

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <HStack justifyContent="space-between" mb={2}>
        <HStack spacing={2}>
            <Heading size="xs" color="brand.500" letterSpacing="widest" textTransform="uppercase">Research Discovery</Heading>
            <Badge variant="subtle" fontSize="9px">BETA</Badge>
        </HStack>
        <IconButton 
          size="xs" 
          variant="ghost" 
          icon={isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />} 
          onClick={onToggle}
          aria-label="Toggle Discovery"
        />
      </HStack>

      <Collapse in={isOpen}>
        <VStack align="stretch" spacing={4} mt={2}>
          <Text fontSize="11px" color="ui.muted">Surface related evidence and find hidden patterns in your data.</Text>
          
          <InputGroup size="xs">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="ui.muted" />
            </InputLeftElement>
            <Input 
                placeholder="Search replay contexts or patterns..." 
                bg="blackAlpha.300" 
                borderColor="ui.border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          <Box>
            <Text fontSize="10px" fontWeight="800" color="ui.muted" mb={2} letterSpacing="wider">SUGGESTED FOR YOU</Text>
            <VStack align="stretch" spacing={2}>
              {(suggestions || []).map(item => (
                <Box key={item.id} p={2} bg="blackAlpha.200" borderRadius="sm" borderWidth="1px" borderColor="ui.border" cursor="pointer" _hover={{ bg: "whiteAlpha.100" }}>
                  <VStack align="stretch" spacing={1}>
                    <HStack justifyContent="space-between">
                        <HStack spacing={2}>
                            <Icon as={item.type === 'Replay' ? TimeIcon : item.type === 'Session' ? LinkIcon : StarIcon} w={2.5} h={2.5} color="brand.500" />
                            <Text fontSize="11px" fontWeight="bold" color="gray.200">{item.title}</Text>
                        </HStack>
                        <Badge fontSize="8px" colorScheme="brand" variant="ghost">{Math.round(item.relevance * 100)}% REL</Badge>
                    </HStack>
                    <HStack justifyContent="space-between">
                        <Badge variant="outline" fontSize="7px">{item.type}</Badge>
                        {item.type === 'Replay' && item.timestamp && (
                            <Button size="2xs" variant="ghost" colorScheme="blue" fontSize="9px" onClick={() => handleShowReplay(item.timestamp!)}>Focus Chart</Button>
                        )}
                    </HStack>
                  </VStack>
                </Box>
              ))}
            </VStack>
          </Box>
          
          <Divider borderColor="ui.border" />
          
          <Button size="xs" variant="outline" color="ui.muted" fontSize="9px" rightIcon={<ChevronRightIcon />}>Explore Global Knowledge Graph</Button>
        </VStack>
      </Collapse>
    </Box>
  );
};

export default ResearchDiscovery;
