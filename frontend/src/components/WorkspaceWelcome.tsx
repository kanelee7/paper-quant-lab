import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { 
  RepeatIcon, 
  ViewIcon, 
  SearchIcon,
  ArrowForwardIcon,
  TimeIcon
} from '@chakra-ui/icons';
import { useI18n } from '../i18n';

interface WorkspaceWelcomeProps {
  onImportDemo: () => void;
  onNewResearch: () => void;
  onReviewEvidence: () => void;
}

const WelcomeCard: React.FC<{ 
  title: string; 
  description: string; 
  icon: any; 
  actionLabel: string; 
  onClick: () => void;
  colorScheme?: string;
}> = ({ title, description, icon, actionLabel, onClick, colorScheme = "brand" }) => (
  <Box 
    p={6} 
    bg="blackAlpha.300" 
    borderWidth="1px" 
    borderColor="ui.border" 
    borderRadius="sm"
    transition="all 0.2s"
    _hover={{ borderColor: 'brand.500', bg: 'blackAlpha.400' }}
  >
    <VStack align="start" spacing={4} h="100%">
      <Icon as={icon} w={6} h={6} color={`${colorScheme}.500`} />
      <Box flex={1}>
        <Heading size="xs" mb={2} textTransform="uppercase" letterSpacing="widest" color="gray.100">{title}</Heading>
        <Text fontSize="xs" color="ui.muted" lineHeight="tall">{description}</Text>
      </Box>
      <Button 
        size="xs" 
        colorScheme={colorScheme} 
        variant="outline" 
        rightIcon={<ArrowForwardIcon />} 
        onClick={onClick}
        w="100%"
        fontSize="10px"
        fontWeight="800"
        letterSpacing="wider"
        borderRadius="xs"
      >
        {actionLabel}
      </Button>
    </VStack>
  </Box>
);

const WorkspaceWelcome: React.FC<WorkspaceWelcomeProps> = ({ 
  onImportDemo, 
  onNewResearch, 
  onReviewEvidence 
}) => {
  const { lang } = useI18n();

  return (
    <Box h="100%" display="flex" alignItems="center" justifyContent="center" position="relative" zIndex={5}>
      <VStack spacing={8} maxW="container.lg" w="100%" py={12}>
        <VStack spacing={2} textAlign="center">
          <Heading size="md" letterSpacing="tight" fontWeight="700" color="gray.100">
            {lang === 'ko' ? "시작점 선택" : "Select a Starting Point"}
          </Heading>
          <Text fontSize="sm" color="ui.muted">
            {lang === 'ko' ? "기존 기록을 불러오거나 새로운 연구 세션을 시작하여 연구를 시작하세요." : "Load an existing archive or initialize a new research session to begin."}
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="100%">
          <WelcomeCard
            title={lang === 'ko' ? "과거 기록 불러오기" : "Load Historical Archive"}
            description={lang === 'ko' ? "연구용 기록 데이터를 불러와 리플레이, 근거 추적, AI 판단 방식을 살펴봅니다. 처음 사용 시 권장됩니다." : "Load a seeded research archive to explore replay, evidence traces, and AI reasoning behavior. Recommended for first-time use."}
            icon={TimeIcon}
            actionLabel={lang === 'ko' ? "기록 데이터 로드" : "LOAD ARCHIVE"}
            onClick={onImportDemo}
          />
          <WelcomeCard
            title={lang === 'ko' ? "새 연구 세션 시작" : "Start Research Session"}
            description={lang === 'ko' ? "실시간 분석 실험 및 신호 기록을 위한 새로운 시뮬레이션을 시작합니다." : "Initialize a fresh simulation for active analytical experimentation and signal capture."}
            icon={SearchIcon}
            actionLabel={lang === 'ko' ? "새 연구 시작" : "NEW RESEARCH RUN"}
            onClick={onNewResearch}
          />
          <WelcomeCard
            title={lang === 'ko' ? "연구 결과 아카이브 열기" : "Open Evidence Archive"}
            description={lang === 'ko' ? "로컬 연구 기록에 접속하여 리플레이 근거, 감사 기록, 기간별 연구 결과를 검토합니다." : "Access your local research archives to review replay evidence, governance traces, and longitudinal findings."}
            icon={ViewIcon}
            actionLabel={lang === 'ko' ? "리뷰 워크스페이스 열기" : "OPEN REVIEW WORKSPACE"}
            onClick={onReviewEvidence}
            colorScheme="pink"
          />
        </SimpleGrid>

        <VStack spacing={3} p={4} bg="blackAlpha.300" borderRadius="sm" border="1px dashed" borderColor="ui.border" maxW="600px">
            <HStack spacing={2}>
                <Box w={2} h={2} bg="brand.500" borderRadius="full" />
                <Text fontSize="10px" fontWeight="800" letterSpacing="widest">{lang === 'ko' ? "시뮬레이션 전용 안내" : "SIMULATION MANDATE"}</Text>
            </HStack>
            <Text fontSize="10px" color="ui.muted" textAlign="center" lineHeight="tall">
                {lang === 'ko' 
                    ? "PaperQuantLab은 AI 판단 연구를 위한 관찰 플랫폼입니다. 실제 거래를 수행하지 않으며, 모든 시장 데이터는 연구, 리플레이, 근거 종합을 위해 시뮬레이션 환경 내에서만 활용됩니다."
                    : "PaperQuantLab is an observability platform for AI reasoning research. It does not execute live trades. All market data is utilized for research, replay, and evidence synthesis within a simulation environment."
                }
            </Text>
        </VStack>

        <Divider borderColor="ui.border" w="40px" />
        
        <HStack spacing={6} fontSize="xs" color="ui.muted">
            <HStack spacing={1}>
                <Icon as={RepeatIcon} w={3} h={3} />
                <Text fontWeight="700">{lang === 'ko' ? "결정론적 리플레이" : "Deterministic Replay"}</Text>
            </HStack>
            <HStack spacing={1}>
                <Icon as={SearchIcon} w={3} h={3} />
                <Text fontWeight="700">{lang === 'ko' ? "판단 과정 관찰" : "Reasoning Observability"}</Text>
            </HStack>
            <HStack spacing={1}>
                <Icon as={ViewIcon} w={3} h={3} />
                <Text fontWeight="700">{lang === 'ko' ? "로컬 중심 기록" : "Local-First Archive"}</Text>
            </HStack>
        </HStack>
      </VStack>
    </Box>
  );
};

export default WorkspaceWelcome;
