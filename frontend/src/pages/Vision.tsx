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
} from '@chakra-ui/react';
import { ArrowBackIcon, ViewIcon, SearchIcon, RepeatIcon } from '@chakra-ui/icons';

const Vision: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const brandColor = 'brand.500';

  return (
    <Box bg="transparent" minH="100vh" color="white">
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
            <Heading size="md" letterSpacing="tight">Vision</Heading>
            <Box w="100px" /> {/* Spacer */}
          </HStack>
        </Container>
      </Box>

      <Container maxW="container.md" pt={20} pb={32}>
        <VStack align="start" spacing={12}>
          <Box>
            <Badge colorScheme="brand" mb={4}>Mission</Badge>
            <Heading size="2xl" mb={6} letterSpacing="tight">
                Reasoning Over <Text as="span" color={brandColor}>Automation</Text>
            </Heading>
            <Text fontSize="lg" color="ui.muted" lineHeight="relaxed">
                PaperQuantLab exists to bridge the gap between complex algorithmic signals and human understanding. 
                We believe the future of trading research isn't in finding a black-box oracle, but in developing 
                high-fidelity observability into how different analytical mindsets interpret market conditions.
            </Text>
          </Box>

          <Divider borderColor="ui.border" />

          <Box>
            <Heading size="lg" mb={4}>AI Research Sandbox</Heading>
            <Text color="ui.muted" mb={6}>
                We treat AI not as a financial authority, but as an experimental persona. Our workstation provides 
                a laboratory where these personas can be debated, audited, and compared against each other.
            </Text>
            <VStack align="start" spacing={6}>
                <HStack align="start" spacing={4}>
                    <Icon as={SearchIcon} color={brandColor} mt={1} />
                    <Box>
                        <Text fontWeight="bold">The "Why" Behind the "Buy"</Text>
                        <Text fontSize="sm" color="ui.muted">Every signal is backed by a full reasoning trace, explaining the confluence of indicators used.</Text>
                    </Box>
                </HStack>
                <HStack align="start" spacing={4}>
                    <Icon as={ViewIcon} color={brandColor} mt={1} />
                    <Box>
                        <Text fontWeight="bold">Persona Comparison</Text>
                        <Text fontSize="sm" color="ui.muted">Contrast multiple analytical styles—Conservative, Momentum, Contrarian—to see where they disagree.</Text>
                    </Box>
                </HStack>
                <HStack align="start" spacing={4}>
                    <Icon as={RepeatIcon} color={brandColor} mt={1} />
                    <Box>
                        <Text fontWeight="bold">Deterministic Replay</Text>
                        <Text fontSize="sm" color="ui.muted">Reproduce exact market states to identify the delta between automated signals and human judgment.</Text>
                    </Box>
                </HStack>
            </VStack>
          </Box>

          <Box p={8} bg="background.surface" borderRadius="xl" border="1px solid" borderColor="ui.border">
            <Heading size="md" mb={4} color={brandColor}>The Anti-Hype Stance</Heading>
            <Text fontSize="sm" color="ui.muted">
                We explicitly reject the narratives of "AI beating the market." Markets are adversarial environments 
                dominated by institutional advantages. Our response is a focus on <b>Decision Quality</b> 
                over <b>Automation Hype</b>.
            </Text>
          </Box>
          
          <Button colorScheme="brand" size="lg" w="100%" onClick={onBack}>
            Return to Exploration
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default Vision;
