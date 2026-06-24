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
  Link,
  Center,
} from '@chakra-ui/react';
import {
  RepeatIcon,
  CheckCircleIcon,
  ArrowForwardIcon,
  TimeIcon,
} from '@chakra-ui/icons';
import { keyframes } from '@emotion/react';
import { motion } from 'framer-motion';
import { QuantMorphField } from '../components/QuantMorphField';
import { QuantGlyphLayer } from '../components/QuantGlyphLayer';
import { useI18n } from '../i18n';

// Deterministic heights – no Math.random() on render
const TIMELINE_HEIGHTS = [38, 55, 28, 65, 42, 50, 35, 72, 45, 30, 58, 40, 68, 25, 52, 44, 60, 32, 47, 56, 29, 64, 39, 48, 33, 70, 43, 27, 61, 46, 36, 53, 31, 67, 41, 49, 26, 57, 38, 54];

const sweep = keyframes`
  0% { transform: translateX(-100%) skewX(-15deg); }
  100% { transform: translateX(200%) skewX(-15deg); }
`;

const WorkstationPreview: React.FC = () => {
  const { lang } = useI18n();
  return (
  <Box
    position="relative"
    maxW="container.xl"
    mx="auto"
    mt={12}
    mb={20}
    borderRadius="sm"
    overflow="hidden"
    borderWidth="1px"
    borderColor="ui.border"
    boxShadow="0 20px 80px -20px rgba(0,0,0,0.8)"
    bg="background.surface"
  >
    {/* Mock UI Header */}
    <HStack bg="blackAlpha.400" px={4} py={2} borderBottom="1px" borderColor="ui.border" justifyContent="space-between">
      <HStack spacing={4}>
        <HStack spacing={1.5}>
          <Box w={2} h={2} borderRadius="full" bg="red.500" opacity={0.6} />
          <Box w={2} h={2} borderRadius="full" bg="orange.500" opacity={0.6} />
          <Box w={2} h={2} borderRadius="full" bg="green.500" opacity={0.6} />
        </HStack>
        <Divider orientation="vertical" h="12px" borderColor="ui.border" />
        <Text fontSize="10px" fontWeight="700" color="ui.muted" letterSpacing="widest">
            {lang === 'ko' ? "세션 활성화됨" : "SESSION ACTIVE"}
        </Text>
      </HStack>
    </HStack>

    {/* UI Content Mockup */}
    <Box p={1} bg="background.deep">
      <HStack align="stretch" spacing={1} h={{ base: "400px", md: "600px" }}>
        {/* Sidebar Mock */}
        <VStack w="240px" display={{ base: 'none', md: 'flex' }} bg="background.surface" borderRight="1px" borderColor="ui.border" p={3} align="stretch" spacing={4}>
          <Box h="20px" bg="whiteAlpha.50" borderRadius="xs" />
          <VStack align="stretch" spacing={2}>
            <Box h="40px" bg="brand.900" borderLeft="2px solid" borderColor="brand.500" borderRadius="xs" />
            <Box h="40px" bg="whiteAlpha.50" borderRadius="xs" />
            <Box h="40px" bg="whiteAlpha.50" borderRadius="xs" />
          </VStack>
          <Divider borderColor="ui.border" />
          <Box h="100px" bg="blackAlpha.400" borderRadius="xs" border="1px dashed" borderColor="ui.border" />
        </VStack>

        {/* Main Content Mock */}
        <VStack flex={1} spacing={1} align="stretch">
          <Box flex={1} bg="background.surface" position="relative" overflow="hidden">
            {/* Chart grid */}
            <Box position="absolute" top="40%" left="0" w="100%" h="1px" bg="whiteAlpha.100" />
            <Box position="absolute" top="60%" left="0" w="100%" h="1px" bg="whiteAlpha.100" />
            <Box position="absolute" top="0" left="30%" w="1px" h="100%" bg="whiteAlpha.100" />
            <Box position="absolute" top="0" left="70%" w="1px" h="100%" bg="whiteAlpha.100" />

            {/* Candle representation */}
            <HStack position="absolute" bottom="20%" left="10%" spacing={2} align="end">
              <Box w="8px" h="40px" bg="status.success" opacity={0.4} />
              <Box w="8px" h="60px" bg="status.success" opacity={0.4} />
              <Box w="8px" h="30px" bg="status.error" opacity={0.4} />
              <Box w="8px" h="20px" bg="status.error" opacity={0.6} border="1px solid" borderColor="status.error" />
              <Box w="8px" h="50px" bg="status.success" opacity={0.4} />
            </HStack>

            <Center position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)">
              <VStack spacing={1} bg="blackAlpha.800" px={5} py={3} border="1px solid" borderColor="brand.500" backdropFilter="blur(8px)" borderRadius="sm">
                <HStack>
                  <Icon as={RepeatIcon} color="brand.500" w={3} h={3} />
                  <Text fontSize="9px" fontWeight="700" letterSpacing="widest" color="brand.500">
                    {lang === 'ko' ? "리플레이 일시정지" : "REPLAY PAUSE POINT"}
                  </Text>
                </HStack>
              </VStack>
            </Center>
          </Box>

          {/* Timeline Mock */}
          <Box h="120px" bg="background.surface" borderTop="1px" borderColor="ui.border" p={3}>
            <HStack h="100%" spacing={1} align="end">
              {TIMELINE_HEIGHTS.map((height, i) => (
                <Box key={i} flex={1} h={`${height}%`} bg="whiteAlpha.100" borderRadius="1px" />
              ))}
            </HStack>
          </Box>
        </VStack>

        {/* Right Sidebar Mock */}
        <VStack w="300px" display={{ base: 'none', md: 'flex' }} bg="background.surface" borderLeft="1px" borderColor="ui.border" p={3} align="stretch" spacing={4}>
          <Text fontSize="10px" fontWeight="700" color="ui.muted">
              {lang === 'ko' ? "근거 추적" : "EVIDENCE TRACE"}
          </Text>
          <VStack align="stretch" spacing={2}>
            <Box p={2} bg="blackAlpha.300" borderRadius="xs" borderLeft="2px solid" borderColor="status.success">
              <Text fontSize="9px" color="status.success" fontWeight="700">
                  {lang === 'ko' ? "신호 클러스터" : "SIGNAL CLUSTER"}
              </Text>
              <Box h="4px" />
              <Box h="8px" bg="whiteAlpha.100" w="80%" />
            </Box>
            <Box p={2} bg="blackAlpha.300" borderRadius="xs" borderLeft="2px solid" borderColor="brand.500">
              <Text fontSize="9px" color="brand.500" fontWeight="700">
                  {lang === 'ko' ? "분석 추적" : "ANALYSIS TRACE"}
              </Text>
              <Box h="4px" />
              <Box h="8px" bg="whiteAlpha.100" w="90%" />
              <Box h="4px" />
              <Box h="8px" bg="whiteAlpha.100" w="60%" />
            </Box>
          </VStack>
        </VStack>
      </HStack>
    </Box>

    {/* Depth fade */}
    <Box
      position="absolute"
      top={0}
      left={0}
      w="100%"
      h="100%"
      bgGradient="linear(to-b, transparent 60%, background.deep 100%)"
      pointerEvents="none"
    />
  </Box>
); };

const ProductShowcaseSection: React.FC<{
  title: string;
  description: string;
  icon: any;
  isReversed?: boolean;
  children: React.ReactNode;
}> = ({ title, description, icon, isReversed, children }) => (
  <Container maxW="container.xl" py={20}>
    <Flex direction={{ base: 'column', lg: isReversed ? 'row-reverse' : 'row' }} align="center" gap={20}>
      <VStack flex={1} align="start" spacing={5}>
        <HStack spacing={3}>
          <Icon as={icon} w={5} h={5} color="brand.500" />
          <Heading size="sm" textTransform="uppercase" letterSpacing="widest" color="gray.100">{title}</Heading>
        </HStack>
        <Text fontSize="md" color="ui.muted" lineHeight="tall" maxW="500px">
          {description}
        </Text>
      </VStack>
      <Box flex={1.5} w="100%">
        {children}
      </Box>
    </Flex>
  </Container>
);

const Landing: React.FC<{
  onLaunch: () => void;
  onNavigate: (page: 'VISION' | 'PHILOSOPHY') => void;
}> = ({ onLaunch, onNavigate }) => {
  const { lang, t, changeLanguage } = useI18n();
  const brandColor = 'brand.500';

  return (
    <Box bg="transparent" minH="100vh" position="relative" overflow="hidden">
      <QuantGlyphLayer />
      {/* Navigation */}
      <Box
        borderBottom="1px"
        borderColor="ui.border"
        py={3}
        bg="rgba(11, 12, 14, 0.8)"
        backdropFilter="blur(12px)"
        position="sticky"
        top={0}
        zIndex={20}
      >
        <Container maxW="container.xl">
          <HStack justifyContent="space-between">
            <HStack spacing={2}>
              <Box w={2} h={2} bg={brandColor} borderRadius="full" />
              <Heading size="sm" letterSpacing="tight" fontWeight="800" display={{ base: 'none', sm: 'block' }}>PaperQuantLab</Heading>
              <Heading size="sm" letterSpacing="tight" fontWeight="800" display={{ base: 'block', sm: 'none' }}>PQL</Heading>
            </HStack>
            <HStack spacing={{ base: 2, md: 6 }}>
              <Link display={{ base: 'none', md: 'inline-block' }} fontSize="10px" fontWeight="700" color="ui.muted" textTransform="uppercase" letterSpacing="widest" _hover={{ color: brandColor }} onClick={() => onNavigate('VISION')}>
                  {lang === 'ko' ? "비전" : "Vision"}
              </Link>
              <Link display={{ base: 'none', md: 'inline-block' }} fontSize="10px" fontWeight="700" color="ui.muted" textTransform="uppercase" letterSpacing="widest" _hover={{ color: brandColor }} onClick={() => onNavigate('PHILOSOPHY')}>
                  {lang === 'ko' ? "철학" : "Philosophy"}
              </Link>
              <Button
                variant="ghost"
                size="xs"
                fontSize="10px"
                fontWeight="800"
                color="ui.muted"
                onClick={() => changeLanguage(lang === 'ko' ? 'en' : 'ko')}
                _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                borderRadius="xs"
                height="24px"
                px={{ base: 1, md: 3 }}
              >
                {lang === 'ko' ? "ENGLISH" : "한국어"}
              </Button>
              <Button size="xs" colorScheme="brand" variant="solid" onClick={onLaunch} px={{ base: 2, md: 4 }} borderRadius="sm" fontSize={{ base: '9px', md: '11px' }}>
                  {lang === 'ko' ? "실행" : "LAUNCH"}
              </Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      {/* Ambient Background & Hero */}
      <Flex 
        position="relative" 
        overflow="hidden" 
        minH="100vh" 
        flexDirection="column"
        justifyContent="center"
        bg="background.deep"
      >
        <QuantMorphField />
        
        {/* Hero */}
        <Container maxW="container.lg" position="relative" zIndex={10}>
          <VStack spacing={10} textAlign="center">
            <Text
              fontSize="11px"
              fontWeight="700"
              color={brandColor}
              textTransform="uppercase"
              letterSpacing="widest"
            >
              PaperQuantLab
            </Text>
            <Heading
              size={{ base: "xl", sm: "3xl" }}
              maxW="800px"
              lineHeight="1.1"
              letterSpacing="tighter"
              fontWeight="800"
            >
              {lang === 'ko' ? "시장 판단력 연구 워크스테이션" : "Market Reasoning Workstation"}
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="gray.200" maxW="640px" lineHeight="tall" opacity={0.9} px={4}>
              {lang === 'ko' ? "근거 추적과 연구 기록을 통해 시장 판단 과정을 리플레이하세요." : "Replay market reasoning through evidence traces and research archives."}
            </Text>
            <Flex direction={{ base: 'column', sm: 'row' }} gap={4} pt={2} w={{ base: '100%', sm: 'auto' }} px={4} justify="center">
              <Button 
                size="md" 
                w={{ base: '100%', sm: 'auto' }}
                px={10} 
                height="52px" 
                colorScheme="brand" 
                onClick={onLaunch} 
                rightIcon={<ArrowForwardIcon />} 
                borderRadius="sm" 
                fontWeight="700" 
                letterSpacing="wider"
                position="relative"
                overflow="hidden"
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 20px rgba(184, 134, 11, 0.4)',
                  _after: {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '30%',
                    height: '100%',
                    background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)',
                    animation: `${sweep} 1.2s ease-in-out`,
                  }
                }}
              >
                {lang === 'ko' ? "워크스테이션 열기" : "OPEN WORKSTATION"}
              </Button>
              <Button 
                size="md" 
                w={{ base: '100%', sm: 'auto' }}
                px={10} 
                height="52px" 
                variant="outline" 
                onClick={() => onNavigate('PHILOSOPHY')} 
                borderRadius="sm" 
                fontWeight="700" 
                letterSpacing="wider"
              >
                {lang === 'ko' ? "연구 방법론" : "Research Method"}
              </Button>
            </Flex>
          </VStack>
        </Container>
        
        {/* Gradient fade to deep background at the bottom of hero */}
        <Box 
          position="absolute" 
          bottom={0} 
          left={0} 
          w="100%" 
          h="200px" 
          bgGradient="linear(to-b, transparent, background.deep)" 
          zIndex={5}
        />
      </Flex>

      {/* Workstation Preview with Scroll Reveal */}
      <Box 
        position="relative" 
        zIndex={10} 
        pt={32} 
        pb={20}
        bg="background.deep"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <WorkstationPreview />
        </motion.div>
      </Box>

      {/* Product Surface Showcases */}
      <Box bg="background.deep" position="relative" zIndex={10}>
        <ProductShowcaseSection
          title={lang === 'ko' ? "리플레이 기반 조사" : "Replay Investigation"}
          icon={RepeatIcon}
          description={lang === 'ko' ? "과거 시장 상황으로 돌아가 세밀한 리플레이를 수행합니다. 결정론적 환경에서 자동화된 신호와 인간의 판단 사이의 차이를 감사하세요." : "Step back into historical market contexts with cycle-accurate replay. Audit the delta between automated signals and human judgment in a deterministic environment."}
        >
          <Box bg="background.surface" h="400px" borderRadius="sm" borderWidth="1px" borderColor="ui.border" overflow="hidden" position="relative">
            <Box p={4} borderBottom="1px" borderColor="ui.border" bg="blackAlpha.300">
              <HStack justifyContent="space-between">
                <Text fontSize="10px" fontWeight="700" color="ui.muted">
                    {lang === 'ko' ? "리플레이 제어" : "REPLAY CONTROLLER"}
                </Text>
                <Badge colorScheme="brand" variant="subtle" fontSize="8px">DETERMINISTIC</Badge>
              </HStack>
            </Box>
            <VStack p={6} align="start" spacing={6}>
              <Box w="100%" h="2px" bg="brand.500" position="relative">
                <Box position="absolute" top="-4px" left="40%" w={2.5} h={2.5} bg="brand.500" borderRadius="full" />
              </Box>
              <SimpleGrid columns={2} w="100%" spacing={6}>
                <Box p={4} bg="blackAlpha.400" borderRadius="sm" border="1px solid" borderColor="ui.border">
                  <Text fontSize="9px" color="ui.muted" mb={2}>BASELINE STATE</Text>
                  <Box h="10px" bg="whiteAlpha.100" w="80%" />
                  <Box h="4px" />
                  <Box h="10px" bg="whiteAlpha.100" w="60%" />
                </Box>
                <Box p={4} bg="blackAlpha.400" borderRadius="sm" border="1px solid" borderColor="brand.500">
                  <Text fontSize="9px" color="brand.500" mb={2}>REPLAY STATE</Text>
                  <Box h="10px" bg="brand.900" w="90%" />
                  <Box h="4px" />
                  <Box h="10px" bg="brand.900" w="70%" />
                </Box>
              </SimpleGrid>
            </VStack>
            <Box position="absolute" bottom={0} left={0} w="100%" h="150px" bgGradient="linear(to-t, background.deep, transparent)" />
          </Box>
        </ProductShowcaseSection>

        <ProductShowcaseSection
          title={lang === 'ko' ? "근거 품질 관리" : "Evidence Governance"}
          icon={CheckCircleIcon}
          isReversed
          description={lang === 'ko' ? "모든 분석적 결정은 엄격한 판단 추적 기록을 생성합니다. 자동화된 근거 점수와 지속적인 출처 추적을 통해 연구 결과를 검토하세요." : "Every analytical decision produces a strict reasoning trace. Audit synthesized findings with automated evidence coverage scoring and persistent provenance tracking."}
        >
          <Box bg="background.surface" h="400px" borderRadius="sm" borderWidth="1px" borderColor="ui.border" p={6}>
            <VStack align="stretch" spacing={6}>
              <HStack justifyContent="space-between">
                <Heading size="xs" color="gray.200">
                    {lang === 'ko' ? "근거 보고서" : "Evidence Report"}
                </Heading>
                <Text fontSize="10px" color="ui.muted">Evidence Coverage</Text>
              </HStack>
              <Divider borderColor="ui.border" />
              <VStack align="stretch" spacing={4}>
                {[1, 2, 3].map(i => (
                  <HStack key={i} p={3} bg="blackAlpha.300" borderRadius="sm" borderLeft="2px solid" borderColor={i === 3 ? 'status.warning' : 'status.success'}>
                    <HStack spacing={4}>
                      <Box w={2} h={2} borderRadius="full" bg={i === 3 ? 'status.warning' : 'status.success'} />
                      <Box>
                        <Text fontSize="11px" fontWeight="600">{lang === 'ko' ? `판단 추적 ${i}` : `Decision Trace ${i}`}</Text>
                        <Text fontSize="9px" color="ui.muted">Linked to replay session</Text>
                      </Box>
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </Box>
        </ProductShowcaseSection>

        <ProductShowcaseSection
          title={lang === 'ko' ? "기간별 연구 아카이브" : "Longitudinal Archives"}
          icon={TimeIcon}
          description={lang === 'ko' ? "전체 실험을 버전 관리되는 저장소로 묶어 보관하세요. 다양한 시장 상황에 따른 AI 판단 방식의 진화를 관찰하고 지식을 축적합니다." : "Bundle entire experiments into versioned repositories. Preserve the evolution of AI reasoning behavior across varied market regimes for long-term knowledge accumulation."}
        >
          <Box bg="background.surface" h="400px" borderRadius="sm" borderWidth="1px" borderColor="ui.border" overflow="hidden">
            <VStack h="100%" spacing={0}>
              <HStack w="100%" p={4} bg="blackAlpha.400" borderBottom="1px" borderColor="ui.border" justifyContent="space-between">
                <Text fontSize="10px" fontWeight="700">
                    {lang === 'ko' ? "아카이브 탐색기" : "ARCHIVE EXPLORER"}
                </Text>
                <Box w={2} h={2} borderRadius="full" bg="brand.500" />
              </HStack>
              <Box flex={1} w="100%" p={4}>
                <SimpleGrid columns={3} spacing={4}>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <Box key={i} h="80px" bg="blackAlpha.200" borderRadius="sm" border="1px solid" borderColor="ui.border" p={2}>
                      <Box h="6px" bg="whiteAlpha.100" w="40%" mb={2} />
                      <Box h="15px" bg="whiteAlpha.50" w="100%" />
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            </VStack>
          </Box>
        </ProductShowcaseSection>
      </Box>

      {/* Research Foundation */}
      <Box bg="background.surface" py={24} borderTop="1px" borderColor="ui.border">
        <Container maxW="container.lg">
          <VStack spacing={8} textAlign="center">
            <Heading size="sm" textTransform="uppercase" letterSpacing="widest" color="brand.500">
                {lang === 'ko' ? "견고한 연구 기반" : "Grounded Research Foundation"}
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={12} textAlign="start">
              <VStack align="start" spacing={4}>
                <Text fontSize="xs" fontWeight="700" color="gray.200">
                    {lang === 'ko' ? "로컬 중심 아키텍처" : "LOCAL-FIRST ARCHITECTURE"}
                </Text>
                <Text fontSize="xs" color="ui.muted" lineHeight="tall">
                  {lang === 'ko' 
                    ? "사용자의 연구 데이터, 전략, 아카이브는 로컬 환경에 보관됩니다. 데이터 주권과 분석 기록의 장기 보존을 최우선으로 합니다."
                    : "Your research data, strategies, and archives remain in your local environment. We prioritize data sovereignty and long-term analytical preservation."
                  }
                </Text>
              </VStack>
              <VStack align="start" spacing={4}>
                <Text fontSize="xs" fontWeight="700" color="gray.200">
                    {lang === 'ko' ? "시뮬레이션 원칙" : "SIMULATION MANDATE"}
                </Text>
                <Text fontSize="xs" color="ui.muted" lineHeight="tall">
                  {lang === 'ko'
                    ? "PaperQuantLab은 시뮬레이션 환경입니다. 실제 거래 기능을 배제하여 실시간 수익 압박 없이 연구의 무결성을 유지할 수 있도록 합니다."
                    : "PaperQuantLab is a simulation environment. No brokerage execution is implemented, ensuring research integrity is never compromised by live P&L pressure."
                  }
                </Text>
              </VStack>
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Footer */}
      <Box py={12} bg="background.deep" borderTop="1px" borderColor="ui.border">
        <Container maxW="container.xl">
          <VStack align="start" spacing={2}>
            <Heading size="xs" letterSpacing="widest" textTransform="uppercase">PaperQuantLab</Heading>
            <Text fontSize="10px" color="ui.muted" maxW="400px">
              {lang === 'ko' 
                ? "기간별 시장 연구를 위한 실험적 판단 관찰 플랫폼입니다. 로컬 중심, 시뮬레이션 전용, 결정론적 시스템을 지향합니다."
                : "Experimental reasoning observability platform for longitudinal market research. Local-first. Simulation-only. Deterministic."
              }
            </Text>
            <Text fontSize="10px" color="ui.muted" mt={2}>&copy; 2026 PaperQuantLab</Text>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;
