import React from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Icon,
  Badge,
  Divider,
  Flex,
  useColorModeValue,
  Link,
} from '@chakra-ui/react';
import { 
  SearchIcon, 
  RepeatIcon, 
  CheckCircleIcon, 
  LockIcon, 
  ViewIcon, 
  InfoOutlineIcon,
  ArrowForwardIcon 
} from '@chakra-ui/icons';
import { keyframes } from '@emotion/react';

interface FeatureProps {
  title: string;
  description: string;
  icon: any;
}

const FeatureCard: React.FC<FeatureProps> = ({ title, description, icon }) => (
  <Box 
    p={6} 
    bg="background.surface" 
    borderWidth="1px" 
    borderColor="ui.border" 
    borderRadius="sm"
    transition="all 0.2s"
    _hover={{ borderColor: 'brand.500' }}
  >
    <Icon as={icon} w={5} h={5} color="brand.500" mb={4} />
    <Heading size="xs" mb={2} textTransform="uppercase" letterSpacing="widest">{title}</Heading>
    <Text fontSize="xs" color="ui.muted" lineHeight="tall">{description}</Text>
  </Box>
);

const Landing: React.FC<{ 
  onLaunch: () => void;
  onNavigate: (page: 'VISION' | 'PHILOSOPHY') => void;
}> = ({ onLaunch, onNavigate }) => {
  const brandColor = 'brand.500';

  return (
    <Box 
        bg="background.deep" 
        minH="100vh" 
        position="relative" 
        overflow="hidden"
    >
      {/* Restrained Background Foundation */}
      <Box 
        position="absolute" 
        top="0" 
        left="0" 
        w="100%" 
        h="100%" 
        bgGradient="radial(circle at 20% 0%, brand.900 0%, transparent 50%)"
        opacity="0.15"
        zIndex={0}
        pointerEvents="none"
      />
      
      <Box 
        position="absolute" 
        top="0" 
        left="0" 
        w="100%" 
        h="100%" 
        bgImage="radial-gradient(whiteAlpha.100 1px, transparent 1px)"
        bgSize="60px 60px"
        opacity="0.05"
        zIndex={0}
      />

      {/* Navigation */}
      <Box 
        borderBottom="1px" 
        borderColor="ui.border" 
        py={3} 
        bg="background.deep" 
        position="sticky" 
        top={0} 
        zIndex={10}
      >
        <Container maxW="container.xl">
          <HStack justifyContent="space-between">
            <HStack spacing={2}>
              <Box w={2} h={2} bg={brandColor} borderRadius="full" />
              <Heading size="sm" letterSpacing="tight" fontWeight="800">PaperQuantLab</Heading>
            </HStack>
            <HStack spacing={8}>
              <Link fontSize="10px" fontWeight="700" color="ui.muted" textTransform="uppercase" letterSpacing="widest" _hover={{ color: brandColor }} onClick={() => onNavigate('VISION')}>Vision</Link>
              <Link fontSize="10px" fontWeight="700" color="ui.muted" textTransform="uppercase" letterSpacing="widest" _hover={{ color: brandColor }} onClick={() => onNavigate('PHILOSOPHY')}>Philosophy</Link>
              <Button size="xs" colorScheme="brand" variant="solid" onClick={onLaunch} px={4} borderRadius="sm">Launch Workstation</Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxW="container.lg" pt={32} pb={24} position="relative" zIndex={1}>
        <VStack spacing={8} textAlign="center">
          <Badge 
            colorScheme="brand" 
            variant="subtle" 
            px={3} 
            py={1} 
            borderRadius="xs" 
            fontSize="9px"
            letterSpacing="widest"
            borderWidth="1px"
            borderColor="brand.500"
            bg="brand.900"
            color="brand.100"
          >
            RESEARCH REPOSITORY & REPLAY LAYER
          </Badge>
          <Heading 
            size="2xl" 
            maxW="900px" 
            lineHeight="1.2" 
            letterSpacing="tighter"
            textAlign="center"
            fontWeight="800"
          >
            <Box as="span" display="block">Analytical Continuity</Box>
            <Box as="span" display="block" color={brandColor}>Evidence-Based Observation</Box>
          </Heading>
          <Text fontSize="md" color="ui.muted" maxW="600px" lineHeight="tall">
            Study AI analytical styles and persona evolution through deterministic replay, 
            structured synthesis, and longitudinal research archives.
          </Text>
          <HStack spacing={4} pt={6}>
            <Button size="md" px={8} height="48px" colorScheme="brand" onClick={onLaunch} rightIcon={<ArrowForwardIcon />} borderRadius="sm">
              Open Workstation
            </Button>
            <Button size="md" px={8} height="48px" variant="outline" onClick={() => onNavigate('PHILOSOPHY')} borderRadius="sm">
              Read Philosophy
            </Button>
          </HStack>
        </VStack>
      </Container>

      {/* Bento Feature Grid */}
      <Container maxW="container.xl" pb={32}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
          <FeatureCard 
            title="Reasoning Trace" 
            icon={SearchIcon}
            description="Every analytical decision produces a detailed reasoning trace and technical indicator snapshot for verification."
          />
          <FeatureCard 
            title="Deterministic Replay" 
            icon={RepeatIcon}
            description="Step back into historical market contexts with cycle-accurate replay for deep post-mortem analysis."
          />
          <FeatureCard 
            title="Evidence Provenance" 
            icon={CheckCircleIcon}
            description="Audit synthesized findings with automated evidence coverage scoring and strict provenance tracking."
          />
          <FeatureCard 
            title="Portable Archives" 
            icon={LockIcon}
            description="Bundle experiments into versioned repositories for long-term preservation and knowledge accumulation."
          />
        </SimpleGrid>
      </Container>

      {/* Product Positioning / Anti-Goals Section */}
      <Box bg="background.surface" py={24} borderY="1px" borderColor="ui.border">
        <Container maxW="container.lg">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={16}>
            <VStack align="start" spacing={6}>
              <Heading size="md" textTransform="uppercase" letterSpacing="widest">Operational <Text as="span" color={brandColor}>Focus</Text></Heading>
              <VStack align="start" spacing={5}>
                <HStack align="start" spacing={4}>
                  <Icon as={ViewIcon} color={brandColor} mt={1} w={4} h={4} />
                  <Box>
                    <Text fontWeight="800" fontSize="xs" textTransform="uppercase" letterSpacing="wider">Reasoning Observability</Text>
                    <Text fontSize="xs" color="ui.muted">Analyze how different AI personas interpret conflicting market indicators without autonomous authority.</Text>
                  </Box>
                </HStack>
                <HStack align="start" spacing={4}>
                  <Icon as={InfoOutlineIcon} color={brandColor} mt={1} w={4} h={4} />
                  <Box>
                    <Text fontWeight="800" fontSize="xs" textTransform="uppercase" letterSpacing="wider">Longitudinal Continuity</Text>
                    <Text fontSize="xs" color="ui.muted">Track analytical drift and persona behavioral evolution across varied market regimes.</Text>
                  </Box>
                </HStack>
              </VStack>
            </VStack>

            <VStack align="start" spacing={6} p={8} bg="blackAlpha.400" borderRadius="sm" border="1px solid" borderColor="ui.border">
              <Heading size="xs" color="brand.500" textTransform="uppercase" letterSpacing="widest">Simulation Disclosures</Heading>
              <VStack align="start" spacing={3} w="100%">
                <Text fontSize="11px" color="gray.400">PaperQuantLab is a simulation-only research environment.</Text>
                <Divider borderColor="whiteAlpha.100" />
                <Text fontSize="11px" color="gray.400">No brokerage execution or live trading is supported.</Text>
                <Divider borderColor="whiteAlpha.100" />
                <Text fontSize="11px" color="gray.400">All findings are for educational and research purposes.</Text>
                <Divider borderColor="whiteAlpha.100" />
                <Text fontSize="11px" color="gray.400">Local-first architecture ensures data privacy and integrity.</Text>
              </VStack>
            </VStack>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Footer */}
      <Box py={12} bg="background.deep">
        <Container maxW="container.xl">
          <Flex direction={{ base: "column", md: "row" }} justifyContent="space-between" align={{ base: "start", md: "center" }} gap={8}>
            <VStack align="start" spacing={2}>
              <Heading size="xs" letterSpacing="widest" textTransform="uppercase">PaperQuantLab</Heading>
              <Text fontSize="10px" color="ui.muted" maxW="400px">
                Experimental reasoning observability platform for longitudinal market research. 
                Local-first. Simulation-only. Deterministic.
              </Text>
              <Text fontSize="10px" color="ui.muted" mt={2}>&copy; 2026 Analytical Research Foundation</Text>
            </VStack>
            <HStack spacing={8}>
              <Link fontSize="10px" fontWeight="700" color="ui.muted" textTransform="uppercase" letterSpacing="widest">Documentation</Link>
              <Link fontSize="10px" fontWeight="700" color="ui.muted" textTransform="uppercase" letterSpacing="widest">Repository</Link>
              <Link fontSize="10px" fontWeight="700" color="ui.muted" textTransform="uppercase" letterSpacing="widest">Policy</Link>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;
