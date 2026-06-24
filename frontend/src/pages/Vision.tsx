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
import { useI18n } from '../i18n';

const Vision: React.FC<{ onBack: () => void }> = ({ onBack }) => {
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
              {lang === 'ko' ? "비전" : "Vision"}
            </Heading>
            <Box w="100px" /> {/* Spacer */}
          </HStack>
        </Container>
      </Box>

      <Container maxW="container.md" pt={20} pb={32}>
        <VStack align="start" spacing={12}>
          <Box>
            <Badge colorScheme="brand" mb={4}>
              {lang === 'ko' ? "우리의 미션" : "Mission"}
            </Badge>
            <Heading size="2xl" mb={6} letterSpacing="tight">
              {lang === 'ko' ? (
                <>
                  자동화보다 <Text as="span" color={brandColor}>설명 가능한 추론</Text>
                </>
              ) : (
                <>
                  Reasoning Over <Text as="span" color={brandColor}>Automation</Text>
                </>
              )}
            </Heading>
            <Text fontSize="lg" color="ui.muted" lineHeight="relaxed">
              {lang === 'ko'
                ? "PaperQuantLab은 복잡한 알고리즘 신호와 인간의 이해 사이의 간극을 좁히기 위해 존재합니다. 우리는 트레이딩 연구의 미래가 블랙박스 오라클을 찾는 것이 아니라, 다양한 분석적 관점이 어떻게 시장 상황을 해석하는지에 대한 고정밀 관찰력을 확보하는 데 있다고 믿습니다."
                : "PaperQuantLab exists to bridge the gap between complex algorithmic signals and human understanding. We believe the future of trading research isn't in finding a black-box oracle, but in developing high-fidelity observability into how different analytical mindsets interpret market conditions."
              }
            </Text>
          </Box>

          <Divider borderColor="ui.border" />

          <Box w="100%">
            <Heading size="lg" mb={4}>
              {lang === 'ko' ? "AI 연구 샌드박스" : "AI Research Sandbox"}
            </Heading>
            <Text color="ui.muted" mb={6}>
              {lang === 'ko'
                ? "우리는 AI를 절대적인 금융 의사결정 주체로 취급하지 않고, 실험적 페르소나로 대합니다. 본 워크스테이션은 이러한 페르소나들의 판단을 토론하고, 감사하며, 비교 분석할 수 있는 실험실을 제공합니다."
                : "We treat AI not as a financial authority, but as an experimental persona. Our workstation provides a laboratory where these personas can be debated, audited, and compared against each other."
              }
            </Text>
            <VStack align="start" spacing={6}>
                <HStack align="start" spacing={4}>
                    <Icon as={SearchIcon} color={brandColor} mt={1} />
                    <Box>
                        <Text fontWeight="bold">
                          {lang === 'ko' ? "매수 판단의 실질적 이유 ('Why')" : "The 'Why' Behind the 'Buy'"}
                        </Text>
                        <Text fontSize="sm" color="ui.muted">
                          {lang === 'ko'
                            ? "모든 분석 신호는 사용된 지표들의 복합적 작용을 설명하는 완전한 추론 경로(Reasoning Trace)에 의해 뒷받침됩니다."
                            : "Every signal is backed by a full reasoning trace, explaining the confluence of indicators used."
                          }
                        </Text>
                    </Box>
                </HStack>
                <HStack align="start" spacing={4}>
                    <Icon as={ViewIcon} color={brandColor} mt={1} />
                    <Box>
                        <Text fontWeight="bold">
                          {lang === 'ko' ? "페르소나 비교 분석" : "Persona Comparison"}
                        </Text>
                        <Text fontSize="sm" color="ui.muted">
                          {lang === 'ko'
                            ? "보수형(Conservative), 모멘텀형(Momentum), 역발상형(Contrarian) 등 다양한 분석 스타일의 차이점과 동의하지 않는 지점을 비교합니다."
                            : "Contrast multiple analytical styles—Conservative, Momentum, Contrarian—to see where they disagree."
                          }
                        </Text>
                    </Box>
                </HStack>
                <HStack align="start" spacing={4}>
                    <Icon as={RepeatIcon} color={brandColor} mt={1} />
                    <Box>
                        <Text fontWeight="bold">
                          {lang === 'ko' ? "결정론적 시장 리플레이" : "Deterministic Replay"}
                        </Text>
                        <Text fontSize="sm" color="ui.muted">
                          {lang === 'ko'
                            ? "정확한 과거 시장 환경을 재현하여, 자동화된 분석 신호와 인간 연구원의 판단 사이의 간극을 추적합니다."
                            : "Reproduce exact market states to identify the delta between automated signals and human judgment."
                          }
                        </Text>
                    </Box>
                </HStack>
            </VStack>
          </Box>

          <Box p={8} bg="background.surface" borderRadius="xl" border="1px solid" borderColor="ui.border" w="100%">
            <Heading size="md" mb={4} color={brandColor}>
              {lang === 'ko' ? "AI 과장광고 거부" : "The Anti-Hype Stance"}
            </Heading>
            <Text fontSize="sm" color="ui.muted">
              {lang === 'ko'
                ? "우리는 'AI가 시장을 이긴다'는 식의 무조건적인 환상을 명확히 거부합니다. 금융 시장은 기관의 정보 우위가 지배하는 적대적인 환경입니다. 이에 대응하여 우리는 자동화에 대한 과장광고보다 '의사결정의 품질' 자체에 집중합니다."
                : "We explicitly reject the narratives of 'AI beating the market.' Markets are adversarial environments dominated by institutional advantages. Our response is a focus on Decision Quality over Automation Hype."
              }
            </Text>
          </Box>
          
          <Button colorScheme="brand" size="lg" w="100%" onClick={onBack}>
            {lang === 'ko' ? "워크스테이션으로 돌아가기" : "Return to Exploration"}
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default Vision;
