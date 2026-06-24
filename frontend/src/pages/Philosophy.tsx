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
import { useI18n } from '../i18n';

const Philosophy: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const brandColor = 'brand.500';
  const { lang } = useI18n();

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
              {lang === 'ko' ? "대시보드로 돌아가기" : "Back to Landing"}
            </Button>
            <Heading size="md" letterSpacing="tight">
              {lang === 'ko' ? "연구 철학" : "Philosophy"}
            </Heading>
            <Box w="100px" /> {/* Spacer */}
          </HStack>
        </Container>
      </Box>

      <Container maxW="container.lg" pt={20} pb={32}>
        <VStack spacing={20} align="stretch">
          <VStack align="center" textAlign="center" spacing={6}>
            <Badge colorScheme="brand" variant="outline">
              {lang === 'ko' ? "핵심 원칙" : "Principles"}
            </Badge>
            <Heading size="2xl" letterSpacing="tight">
              {lang === 'ko' ? (
                <>
                  투명성을 통한 <Text as="span" color={brandColor}>신뢰</Text>
                </>
              ) : (
                <>
                  Trust Through <Text as="span" color={brandColor}>Transparency</Text>
                </>
              )}
            </Heading>
            <Text fontSize="xl" color="ui.muted" maxW="800px">
              {lang === 'ko' 
                ? "PaperQuantLab은 대부분의 개인용 자동 매매 시스템이 설명 가능성과 인간의 직관적 이해가 부족하기 때문에 실패한다는 믿음 위에서 설계되었습니다."
                : "PaperQuantLab is built on the belief that most retail auto-trading systems fail because they lack explainability and human understanding."
              }
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
            <Box p={8} bg="background.surface" borderRadius="xl" border="1px solid" borderColor="ui.border">
                <HStack mb={4}>
                    <Icon as={CheckCircleIcon} color={brandColor} />
                    <Heading size="md">
                      {lang === 'ko' ? "설명 가능성 우선" : "Explainability-First"}
                    </Heading>
                </HStack>
                <Text color="ui.muted">
                  {lang === 'ko'
                    ? "의사결정의 이유를 스스로 설명할 수 없는 시스템은 분석 신호를 제공해서는 안 됩니다. 우리는 단순한 알고리즘의 속도보다 명확한 분석적 출처를 우선합니다."
                    : "If a system cannot explain its reasoning, it should not be making signals. We prioritize clear analytical provenance over pure algorithmic speed."
                  }
                </Text>
            </Box>
            <Box p={8} bg="background.surface" borderRadius="xl" border="1px solid" borderColor="ui.border">
                <HStack mb={4}>
                    <Icon as={InfoOutlineIcon} color={brandColor} />
                    <Heading size="md">
                      {lang === 'ko' ? "시뮬레이션 우선" : "Simulation-First"}
                    </Heading>
                </HStack>
                <Text color="ui.muted">
                  {lang === 'ko'
                    ? "연구 결과는 높은 품질의 시뮬레이션이라는 '안전 지대' 내에서 먼저 입증되어야 합니다. 성급한 실제 거래 집행을 방지하여 연구자를 보호합니다."
                    : "Research must be proven in the 'safe harbor' of high-fidelity simulation. We protect researchers by preventing premature brokerage execution."
                  }
                </Text>
            </Box>
            <Box p={8} bg="background.surface" borderRadius="xl" border="1px solid" borderColor="ui.border">
                <HStack mb={4}>
                    <Icon as={WarningIcon} color={brandColor} />
                    <Heading size="md">
                      {lang === 'ko' ? "인간 중심의 설계" : "Human-in-the-Loop"}
                    </Heading>
                </HStack>
                <Text color="ui.muted">
                  {lang === 'ko'
                    ? "본 워크스테이션은 의사결정을 대체하는 것이 아니라 의사결정을 지원하기 위해 존재합니다. 모든 연구 결과에 대한 최종 결정 권한은 인간 연구자에게 있습니다."
                    : "Our workstation is for Decision Support, not Decision Replacement. Human judgment remains the final authority on every research finding."
                  }
                </Text>
            </Box>
            <Box p={8} bg="background.surface" borderRadius="xl" border="1px solid" borderColor="ui.border">
                <HStack mb={4}>
                    <Icon as={LockIcon} color={brandColor} />
                    <Heading size="md">
                      {lang === 'ko' ? "로컬 중심의 무결성" : "Local-First Integrity"}
                    </Heading>
                </HStack>
                <Text color="ui.muted">
                  {lang === 'ko'
                    ? "귀하의 연구 데이터, 전략 및 기록은 독점적인 지식 자산입니다. 우리는 모든 데이터를 로컬에 보관하여 비공개성과 주권을 보장합니다."
                    : "Your research data, strategies, and archives are your proprietary knowledge. We keep everything local, private, and within your control."
                  }
                </Text>
            </Box>
          </SimpleGrid>

          <Box p={10} bg="blackAlpha.400" borderRadius="2xl" border="1px dashed" borderColor="ui.border">
            <Heading size="lg" mb={8} color="red.300">
              {lang === 'ko' ? "무결성 권고사항" : "The Integrity Mandates"}
            </Heading>
            <VStack align="start" spacing={6}>
                <Box>
                    <Text fontWeight="bold" color="gray.200">
                      {lang === 'ko' ? "자율적 수익 창출 배제" : "No Autonomous Profit Generation"}
                    </Text>
                    <Text fontSize="sm" color="ui.muted">
                      {lang === 'ko'
                        ? "연구의 진보는 지속적인 전략 조정과 솔직한 사후 분석을 통해 이루어지며, 방치형 자동 매매 루프를 배제합니다."
                        : "Progress is made through strategy adjustment and honest post-mortem, not 'set and forget' loops."
                      }
                    </Text>
                </Box>
                <Divider borderColor="whiteAlpha.100" />
                <Box>
                    <Text fontWeight="bold" color="gray.200">
                      {lang === 'ko' ? "초고주파 매매 배제" : "No High-Frequency Trading"}
                    </Text>
                    <Text fontSize="sm" color="ui.muted">
                      {lang === 'ko'
                        ? "우리의 연구 초점은 전략적 추론과 시장 변화에 대한 행동적 적응에 있으며, 기술적 네트워크 대기 시간의 우위에 의존하지 않습니다."
                        : "Our focus is on strategic reasoning and behavioral adaptation, not technical latency advantages."
                      }
                    </Text>
                </Box>
                <Divider borderColor="whiteAlpha.100" />
                <Box>
                    <Text fontWeight="bold" color="gray.200">
                      {lang === 'ko' ? "브로커리지 자동화 배제" : "No Brokerage Automation"}
                    </Text>
                    <Text fontSize="sm" color="ui.muted">
                      {lang === 'ko'
                        ? "실제 투자 손익에 따른 스트레스로부터 연구의 편향성을 보호하기 위해, 실제 거래 연동보다 시뮬레이션 샌드박스를 최우선 과제로 삼습니다."
                        : "We prioritize the simulated sandbox over live execution to ensure research remains unbiased by P&L stress."
                      }
                    </Text>
                </Box>
            </VStack>
          </Box>

          <Button colorScheme="brand" size="lg" onClick={onBack}>
            {lang === 'ko' ? "워크스테이션으로 돌아가기" : "Return to Workstation"}
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default Philosophy;
