import React from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  HStack,
  Icon,
  Badge,
  Divider,
  SimpleGrid,
} from '@chakra-ui/react';
import { ArrowBackIcon, CheckCircleIcon, WarningIcon, InfoOutlineIcon, LockIcon } from '@chakra-ui/icons';

const Philosophy: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const brandColor = 'brand.500';

  return (
    <Box bg="background.deep" minH="100vh" color="white">
      <Box borderBottom="1px" borderColor="ui.border" py={4} bg="blackAlpha.300">
        <Container maxW="container.xl">
          <HStack justifyContent="space-between">
            <Button 
                variant="ghost" 
                size="sm" 
                leftIcon={<ArrowBackIcon />} 
                onClick={onBack}
                _hover={{ color: brandColor }}
            >
              Back to Landing
            </Button>
            <Heading size="md" letterSpacing="tight">Philosophy</Heading>
            <Box w="100px" /> {/* Spacer */}
          </HStack>
        </Container>
      </Box>

      <Container maxW="container.lg" pt={20} pb={32}>
        <VStack spacing={20} align="stretch">
          <VStack align="center" textAlign="center" spacing={6}>
            <Badge colorScheme="brand" variant="outline">Principles</Badge>
            <Heading size="2xl" letterSpacing="tight">
                Trust Through <Text as="span" color={brandColor}>Transparency</Text>
            </Heading>
            <Text fontSize="xl" color="ui.muted" maxW="800px">
                PaperQuantLab is built on the belief that most retail auto-trading systems fail 
                because they lack explainability and human understanding.
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
            <Box p={8} bg="background.surface" borderRadius="xl" border="1px solid" borderColor="ui.border">
                <HStack mb={4}>
                    <Icon as={CheckCircleIcon} color={brandColor} />
                    <Heading size="md">Explainability-First</Heading>
                </HStack>
                <Text color="ui.muted">
                    If a system cannot explain its reasoning, it should not be making signals. 
                    We prioritize clear analytical provenance over pure algorithmic speed.
                </Text>
            </Box>
            <Box p={8} bg="background.surface" borderRadius="xl" border="1px solid" borderColor="ui.border">
                <HStack mb={4}>
                    <Icon as={InfoOutlineIcon} color={brandColor} />
                    <Heading size="md">Simulation-First</Heading>
                </HStack>
                <Text color="ui.muted">
                    Research must be proven in the "safe harbor" of high-fidelity simulation. 
                    We protect researchers by preventing premature brokerage execution.
                </Text>
            </Box>
            <Box p={8} bg="background.surface" borderRadius="xl" border="1px solid" borderColor="ui.border">
                <HStack mb={4}>
                    <Icon as={WarningIcon} color={brandColor} />
                    <Heading size="md">Human-in-the-Loop</Heading>
                </HStack>
                <Text color="ui.muted">
                    Our workstation is for <b>Decision Support</b>, not <b>Decision Replacement</b>. 
                    Human judgment remains the final authority on every research finding.
                </Text>
            </Box>
            <Box p={8} bg="background.surface" borderRadius="xl" border="1px solid" borderColor="ui.border">
                <HStack mb={4}>
                    <Icon as={LockIcon} color={brandColor} />
                    <Heading size="md">Local-First Integrity</Heading>
                </HStack>
                <Text color="ui.muted">
                    Your research data, strategies, and archives are your proprietary knowledge. 
                    We keep everything local, private, and within your control.
                </Text>
            </Box>
          </SimpleGrid>

          <Box p={10} bg="blackAlpha.400" borderRadius="2xl" border="1px dashed" borderColor="ui.border">
            <Heading size="lg" mb={8} color="red.300">The Integrity Mandates</Heading>
            <VStack align="start" spacing={6}>
                <Box>
                    <Text fontWeight="bold" color="gray.200">No Autonomous Profit Generation</Text>
                    <Text fontSize="sm" color="ui.muted">Progress is made through strategy adjustment and honest post-mortem, not "set and forget" loops.</Text>
                </Box>
                <Divider borderColor="whiteAlpha.100" />
                <Box>
                    <Text fontWeight="bold" color="gray.200">No High-Frequency Trading</Text>
                    <Text fontSize="sm" color="ui.muted">Our focus is on strategic reasoning and behavioral adaptation, not technical latency advantages.</Text>
                </Box>
                <Divider borderColor="whiteAlpha.100" />
                <Box>
                    <Text fontWeight="bold" color="gray.200">No Brokerage Automation</Text>
                    <Text fontSize="sm" color="ui.muted">We prioritize the simulated sandbox over live execution to ensure research remains unbiased by P&L stress.</Text>
                </Box>
            </VStack>
          </Box>

          <Button colorScheme="brand" size="lg" onClick={onBack}>
            Return to Workstation
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default Philosophy;
