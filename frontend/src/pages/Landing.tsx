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
    borderRadius="xl"
    transition="all 0.3s"
    _hover={{ borderColor: 'brand.500', transform: 'translateY(-4px)' }}
  >
    <Icon as={icon} w={6} h={6} color="brand.500" mb={4} />
    <Heading size="sm" mb={2}>{title}</Heading>
    <Text fontSize="xs" color="ui.muted" lineHeight="tall">{description}</Text>
  </Box>
);

const drift = keyframes`
  from { transform: translate(0, 0); }
  to { transform: translate(-20px, -20px); }
`;

const glowPulse = keyframes`
  0% { opacity: 0.1; }
  50% { opacity: 0.25; }
  100% { opacity: 0.1; }
`;

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
      {/* Subtle Background Drift Foundation */}
      <Box 
        position="absolute" 
        top="-10%" 
        left="-10%" 
        w="120%" 
        h="120%" 
        bgGradient="radial(circle at 20% 30%, brand.900 0%, transparent 40%), radial(circle at 80% 70%, blue.900 0%, transparent 40%)"
        animation={`${glowPulse} 10s ease-in-out infinite`}
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
        bgSize="40px 40px"
        opacity="0.1"
        animation={`${drift} 60s linear infinite`}
        zIndex={0}
      />

      {/* Navigation */}
      <Box 
        borderBottom="1px" 
        borderColor="ui.border" 
        py={4} 
        bg="blackAlpha.400" 
        backdropFilter="blur(10px)" 
        position="sticky" 
        top={0} 
        zIndex={10}
      >
        <Container maxW="container.xl">
          <HStack justifyContent="space-between">
            <HStack spacing={2}>
              <Box w={3} h={3} bg={brandColor} borderRadius="full" boxShadow="glow" />
              <Heading size="md" letterSpacing="tight">PaperQuantLab</Heading>
            </HStack>
            <HStack spacing={8}>
              <Link fontSize="xs" fontWeight="700" color="ui.muted" _hover={{ color: brandColor }} onClick={() => onNavigate('VISION')}>Vision</Link>
              <Link fontSize="xs" fontWeight="700" color="ui.muted" _hover={{ color: brandColor }} onClick={() => onNavigate('PHILOSOPHY')}>Philosophy</Link>
              <Button size="sm" colorScheme="brand" variant="solid" onClick={onLaunch}>Launch Workstation</Button>
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
            px={4} 
            py={1.5} 
            borderRadius="full" 
            fontSize="10px"
            letterSpacing="widest"
            borderWidth="1px"
            borderColor="brand.500"
          >
            RESEARCH-CENTRIC & LOCAL-FIRST
          </Badge>
          <Heading size="4xl" maxW="900px" lineHeight="1.0" letterSpacing="tighter">
            High-Fidelity AI Reasoning <Text as="span" color={brandColor}>Research</Text>
          </Heading>
          <Text fontSize="xl" color="ui.muted" maxW="700px" lineHeight="tall">
            Study AI analytical styles, validate reasoning patterns, and accumulate 
            evidence-backed market insights through deterministic replay and 
            structured synthesis.
          </Text>
          <HStack spacing={4} pt={6}>
            <Button size="lg" px={10} height="56px" colorScheme="brand" onClick={onLaunch} rightIcon={<ArrowForwardIcon />}>
              Open Workstation
            </Button>
            <Button size="lg" px={10} height="56px" variant="outline" onClick={() => onNavigate('PHILOSOPHY')}>
              Read Philosophy
            </Button>
          </HStack>
        </VStack>
      </Container>

      {/* Bento Feature Grid */}
      <Container maxW="container.xl" pb={32}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <FeatureCard 
            title="Explainable Signals" 
            icon={SearchIcon}
            description="Every strategy decision produces a detailed reasoning trace and technical indicator snapshot."
          />
          <FeatureCard 
            title="Replay Intelligence" 
            icon={RepeatIcon}
            description="Step back into any historical market context with deterministic replay for deep post-mortem analysis."
          />
          <FeatureCard 
            title="Evidence Governance" 
            icon={CheckCircleIcon}
            description="Audit synthesized findings with automated evidence coverage scoring and provenance tracking."
          />
          <FeatureCard 
            title="Reproducible Archives" 
            icon={LockIcon}
            description="Bundle entire experiments into portable, versioned archives for long-term preservation and accumulation."
          />
        </SimpleGrid>
      </Container>

      {/* Product Positioning / Anti-Goals Section */}
      <Box bg="background.surface" py={24} borderY="1px" borderColor="ui.border">
        <Container maxW="container.lg">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={16}>
            <VStack align="start" spacing={6}>
              <Heading size="lg">Designed for <Text as="span" color={brandColor}>Understanding</Text></Heading>
              <VStack align="start" spacing={4}>
                <HStack align="start">
                  <Icon as={ViewIcon} color={brandColor} mt={1} />
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">Reasoning Observability</Text>
                    <Text fontSize="xs" color="ui.muted">See exactly how AI personas interpret conflicting market indicators.</Text>
                  </Box>
                </HStack>
                <HStack align="start">
                  <Icon as={InfoOutlineIcon} color={brandColor} mt={1} />
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">Longitudinal Learning</Text>
                    <Text fontSize="xs" color="ui.muted">Track analytical drift and persona evolution across different market cycles.</Text>
                  </Box>
                </HStack>
              </VStack>
            </VStack>

            <VStack align="start" spacing={6} p={8} bg="blackAlpha.400" borderRadius="xl" border="1px dashed" borderColor="ui.border">
              <Heading size="md" color="red.300">Integrity Mandates</Heading>
              <VStack align="start" spacing={3}>
                <Text fontSize="xs" color="gray.400">PaperQuantLab is NOT an autonomous trading bot.</Text>
                <Divider borderColor="whiteAlpha.100" />
                <Text fontSize="xs" color="gray.400">We do NOT promise market-beating profit or "alpha."</Text>
                <Divider borderColor="whiteAlpha.100" />
                <Text fontSize="xs" color="gray.400">No brokerage execution is ever implemented.</Text>
                <Divider borderColor="whiteAlpha.100" />
                <Text fontSize="xs" color="gray.400">Human judgment remains the final authority.</Text>
              </VStack>
            </VStack>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Footer */}
      <Box py={16}>
        <Container maxW="container.xl">
          <HStack justifyContent="space-between">
            <VStack align="start" spacing={1}>
              <Heading size="xs">PaperQuantLab</Heading>
              <Text fontSize="2xs" color="ui.muted">Local-First Research Foundation &copy; 2026</Text>
            </VStack>
            <HStack spacing={8}>
              <Link fontSize="2xs" color="ui.muted">Documentation</Link>
              <Link fontSize="2xs" color="ui.muted">GitHub</Link>
              <Link fontSize="2xs" color="ui.muted">Archival Policy</Link>
            </HStack>
          </HStack>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;
