import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  VStack,
  Text,
  Button,
  useToast,
  useColorMode,
  useColorModeValue,
  IconButton,
  Flex,
  Heading,
  HStack,
  useDisclosure,
  Collapse,
  ChakraProvider,
  Divider,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Icon,
} from '@chakra-ui/react';

import { 
  SunIcon, 
  MoonIcon, 
  ChevronUpIcon, 
  ChevronDownIcon, 
  ViewIcon,
  SearchIcon,
  SettingsIcon,
} from '@chakra-ui/icons';
import OrderBook from './components/OrderBook';
import TradeHistory from './components/TradeHistory';
import TradingForm from './components/TradingForm';
import PriceChart from './components/PriceChart';
import ExchangeSettings from './components/ExchangeSettings';
import theme from './theme';
import RepeatTrading from './components/RepeatTrading';
import SignalJournal from './components/SignalJournal';
import ResearchNotebook from './components/ResearchNotebook';
import PerformanceMetrics from './components/PerformanceMetrics';
import PersonaSandbox from './components/PersonaSandbox';
import ResearchSessionManager from './components/ResearchSessionManager';
import HypothesisManager from './components/HypothesisManager';
import ResearchCommentary from './components/ResearchCommentary';
import ReliabilityDashboard from './components/ReliabilityDashboard';
import CollaborativeGovernance from './components/CollaborativeGovernance';
import ResearchArchiveManager from './components/ResearchArchiveManager';
import ResearchReviewBoard from './components/ResearchReviewBoard';
import ResearchWorkflowGuide from './components/ResearchWorkflowGuide';
import MultiPerspectiveReview from './components/MultiPerspectiveReview';
import ReplayTimeline from './components/ReplayTimeline';
import ReplaySnapshotManager from './components/ReplaySnapshotManager';
import GuidedWalkthrough from './components/GuidedWalkthrough';
import WorkspaceOnboarding from './components/WorkspaceOnboarding';
import LearningPathManager from './components/LearningPathManager';
import WorkspaceWelcome from './components/WorkspaceWelcome';
import Landing from './pages/Landing';
import Vision from './pages/Vision';
import Philosophy from './pages/Philosophy';
import { useI18n } from './i18n';
import { usePreferences } from './hooks/usePreferences';
import CommandPalette from './components/CommandPalette';
import AmbientBackground from './components/AmbientBackground';
import { isDemoModeActive, setDemoMode as setDemoModeInService } from './demo/demoService';
import { demoFetch } from './demo/demoFetch';
import { API_BASE_URL } from './config/api';

const SidebarSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: defaultOpen });
  return (
    <VStack align="stretch" spacing={0} bg="background.surface" borderRadius="sm" borderWidth="1px" borderColor="ui.border">
      <HStack 
        justifyContent="space-between" 
        cursor="pointer" 
        onClick={onToggle}
        px={3}
        py={2}
        bg="blackAlpha.300"
      >
        <Text fontSize="10px" fontWeight="800" color="ui.muted" letterSpacing="0.1em" textTransform="uppercase">{title}</Text>
        <Icon 
            as={isOpen ? ChevronUpIcon : ChevronDownIcon} 
            w={3} h={3} 
            color="ui.muted"
        />
      </HStack>
      <Collapse in={isOpen}>
        <Box p={3}>
            <VStack align="stretch" spacing={4}>
                {children}
            </VStack>
        </Box>
      </Collapse>
    </VStack>
  );
};

const App: React.FC = () => {
  const { lang, t, changeLanguage } = useI18n();
  const { preferences, toggleFocusMode } = usePreferences();
  
  const [currentPage, setCurrentPage] = React.useState<'LANDING' | 'VISION' | 'PHILOSOPHY' | 'WORKSTATION'>(() => {
    return (localStorage.getItem('pql_current_page') as any) || 'LANDING';
  });
  const [isTrading, setIsTrading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(isDemoModeActive());

  const [selectedExchange, setSelectedExchange] = useState(() => {
    return localStorage.getItem('pql_selected_exchange') || 'binance';
  });
  const [selectedSymbol, setSelectedSymbol] = useState(() => {
    return localStorage.getItem('pql_selected_symbol') || 'BTC/USDT';
  });
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [workspaceMode, setWorkspaceMode] = useState<'RESEARCH' | 'REVIEW' | 'TRAINING'>(() => {
    return (localStorage.getItem('pql_workspace_mode') as any) || 'RESEARCH';
  });
  const [investigatingSignalId, setInvestigatingSignalId] = useState<string | null>(null);
  
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('transparent', 'transparent'); // Let AmbientBackground handle base bg
  const cardBg = useColorModeValue('white', 'background.surface');
  const borderColor = useColorModeValue('gray.200', 'ui.border');

  // Continuity Persistence
  useEffect(() => {
    localStorage.setItem('pql_current_page', currentPage);
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem('pql_selected_exchange', selectedExchange);
  }, [selectedExchange]);

  useEffect(() => {
    localStorage.setItem('pql_selected_symbol', selectedSymbol);
  }, [selectedSymbol]);

  useEffect(() => {
    localStorage.setItem('pql_workspace_mode', workspaceMode);
  }, [workspaceMode]);

  const handleLaunchWorkstation = () => {
    setCurrentPage('WORKSTATION');
  };

  const handleNavigate = (page: 'VISION' | 'PHILOSOPHY') => {
    setCurrentPage(page);
  };

  const handleBackToLanding = () => {
    setCurrentPage('LANDING');
  };

  const handleToggleDemoMode = () => {
    const nextMode = !isDemoMode;
    setIsDemoMode(nextMode);
    setDemoModeInService(nextMode);
    
    if (nextMode) {
      setWorkspaceMode('REVIEW');
    }

    toast({
      title: nextMode ? 'Demo Environment Seeded' : 'Returning to Live Environment',
      description: nextMode ? 'Workstation populated with historical research data. Review Mode active.' : 'Resyncing with active data providers.',
      status: 'info',
      duration: 3000
    });
    // Hard reload or state trigger for components
    if (nextMode) {
        setIsConnected(true);
    }
    setTimeout(() => window.location.reload(), 500);
  };

  const handleFocusSignal = (signal: any) => {
    setInvestigatingSignalId(signal.id);
    const event = new CustomEvent('focus-chart', {
      detail: { timestamp: new Date(signal.timestamp).getTime() }
    });
    window.dispatchEvent(event);
  };

  const handleClearFocus = () => {
      setInvestigatingSignalId(null);
  };

  // Attach a global listener to clear focus when clicking outside or hitting escape?
  // For now, we will add a clear focus button in ReplayTimeline or header.


  const handleStartTrading = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auto-trading/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: selectedSymbol, strategy: 'price_change', interval: 60, test_mode: testMode }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setIsTrading(true);
        toast({ title: 'Simulation Started', status: 'success' });
      }
    } catch (e) {}
  };

  const handleStopTrading = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auto-trading/stop`, { method: 'POST' });
      const data = await response.json();
      if (data.status === 'success') {
        setIsTrading(false);
        toast({ title: 'Simulation Stopped', status: 'info' });
      }
    } catch (e) {}
  };

  const handleConnect = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/select-market`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedExchange,
          asset_type: 'CRYPTO',
          api_key: apiKey,
          secret: secretKey,
        }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setIsConnected(true);
        setShowApiInput(false);
        toast({
          title: lang === 'ko' ? '연구 환경이 연결되었습니다.' : 'Market Connected',
          description: data.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: lang === 'ko' ? '초기화 실패' : 'Initialization Failed',
          description: data.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Failed to communicate with research workstation.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/disconnect-exchange`, { method: 'POST' });
      const data = await response.json();
      if (data.status === 'success') {
        setIsConnected(false);
        setApiKey('');
        setSecretKey('');
        setShowApiInput(false);
        toast({
          title: lang === 'ko' ? '데이터 피드 연결이 해제되었습니다.' : 'Market Disconnected',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: lang === 'ko' ? '연결 해제 실패' : 'Disconnection Failed',
          description: data.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Failed to disconnect from data source.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleTestConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchange_name: selectedExchange,
          api_key: apiKey,
          secret: secretKey,
        }),
      });
      const data = await response.json();
      toast({
        title: data.status === 'success' ? (lang === 'ko' ? '인증 성공' : 'Access Validated') : (lang === 'ko' ? '인증 실패' : 'Validation Failed'),
        description: data.message,
        status: data.status === 'success' ? 'success' : 'error',
        duration: 3000,
        isClosable: true,
      });
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Failed to validate analytical feed.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleLoadEnvKeys = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/load-env-keys?exchange=${selectedExchange}`);
      const data = await response.json();
      if (data.status === 'success') {
        setApiKey(data.api_key);
        setSecretKey(data.secret_key);
        setShowApiInput(true);
        toast({
          title: lang === 'ko' ? 'API 키 로드 완료' : 'Keys Loaded Successfully',
          description: data.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: lang === 'ko' ? 'API 키 로드 실패' : 'Failed to Load Keys',
          description: data.message,
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Failed to load environment keys.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (currentPage === 'LANDING') {
    return (
      <ChakraProvider theme={theme}>
        <AmbientBackground />
        <Landing onLaunch={handleLaunchWorkstation} onNavigate={handleNavigate} />
      </ChakraProvider>
    );
  }

  if (currentPage === 'VISION') {
    return (
      <ChakraProvider theme={theme}>
        <AmbientBackground />
        <Vision onBack={handleBackToLanding} />
      </ChakraProvider>
    );
  }

  if (currentPage === 'PHILOSOPHY') {
    return (
      <ChakraProvider theme={theme}>
        <AmbientBackground />
        <Philosophy onBack={handleBackToLanding} />
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={theme}>
      <AmbientBackground />
      <WorkspaceOnboarding />
      <CommandPalette onModeChange={setWorkspaceMode} onFocusModeToggle={toggleFocusMode} />
      
      <Flex h="100vh" flexDir="column" bg={bgColor} overflow="hidden">
        {/* Fixed Header */}
        <Box 
          borderBottom="1px" 
          borderColor={borderColor} 
          bg="background.surface" 
          zIndex={10} 
          boxShadow="sm"
          flexShrink={0}
        >
            <Container maxW="container.2xl" py={2}>
                <Flex justifyContent="space-between" alignItems="center">
                <HStack spacing={6} flex={1}>
                    <HStack spacing={2} cursor="pointer" onClick={handleBackToLanding}>
                        <Box w={2} h={2} bg="brand.500" borderRadius="full" />
                        <Heading size="sm" letterSpacing="tight" fontWeight="800">PaperQuantLab</Heading>
                    </HStack>
                    <Divider orientation="vertical" h="16px" borderColor="ui.border" />
                    <Button 
                        size="xs" 
                        variant="ghost" 
                        leftIcon={<SearchIcon w={3} h={3} />}
                        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                        color="ui.muted"
                        fontSize="10px"
                        fontWeight="800"
                        _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
                    >
                        COMMANDS
                    </Button>
                </HStack>

                <HStack bg="background.elevated" p={0.5} borderRadius="sm" borderWidth="1px" borderColor="ui.border" spacing={0}>
                    <Tooltip label="Active observation and signal capture" fontSize="2xs" bg="background.elevated" color="white" borderRadius="xs">
                        <Button 
                        size="2xs" 
                        variant="ghost" 
                        color={workspaceMode === 'RESEARCH' ? 'brand.500' : 'ui.muted'} 
                        bg={workspaceMode === 'RESEARCH' ? 'whiteAlpha.100' : 'transparent'}
                        _hover={{ bg: 'whiteAlpha.200' }}
                        onClick={() => setWorkspaceMode('RESEARCH')}
                        fontSize="10px"
                        fontWeight="800"
                        px={3}
                        borderRadius="xs"
                        letterSpacing="wider"
                        >
                        {lang === 'ko' ? "연구" : "RESEARCH"}
                        </Button>
                    </Tooltip>
                    <Tooltip label="Post-mortem synthesis and evidence review" fontSize="2xs" bg="background.elevated" color="white" borderRadius="xs">
                        <Button 
                        size="2xs" 
                        variant="ghost" 
                        color={workspaceMode === 'REVIEW' ? 'pink.400' : 'ui.muted'} 
                        bg={workspaceMode === 'REVIEW' ? 'whiteAlpha.100' : 'transparent'}
                        _hover={{ bg: 'whiteAlpha.200' }}
                        onClick={() => setWorkspaceMode('REVIEW')}
                        fontSize="10px"
                        fontWeight="800"
                        px={3}
                        borderRadius="xs"
                        letterSpacing="wider"
                        >
                        {lang === 'ko' ? "리뷰" : "REVIEW"}
                        </Button>
                    </Tooltip>
                    <Tooltip label="Guided pattern interpretation" fontSize="2xs" bg="background.elevated" color="white" borderRadius="xs">
                        <Button 
                        size="2xs" 
                        variant="ghost" 
                        color={workspaceMode === 'TRAINING' ? 'green.400' : 'ui.muted'} 
                        bg={workspaceMode === 'TRAINING' ? 'whiteAlpha.100' : 'transparent'}
                        _hover={{ bg: 'whiteAlpha.200' }}
                        onClick={() => setWorkspaceMode('TRAINING')}
                        fontSize="10px"
                        fontWeight="800"
                        px={3}
                        borderRadius="xs"
                        letterSpacing="wider"
                        >
                        {lang === 'ko' ? "학습" : "TRAINING"}
                        </Button>
                    </Tooltip>
                </HStack>

                <HStack spacing={4} flex={1} justifyContent="flex-end">
                    <Button 
                        size="xs" 
                        variant="outline" 
                        colorScheme={isDemoMode ? "brand" : "gray"} 
                        onClick={handleToggleDemoMode}
                        fontSize="9px"
                        fontWeight="800"
                        letterSpacing="wider"
                        px={3}
                        borderRadius="sm"
                    >
                        {isDemoMode ? (lang === 'ko' ? "데모 데이터 로드됨" : "REPOSITORY: DEMO_ARCHIVE") : (lang === 'ko' ? "데모 데이터 불러오기" : "INIT DEMO REPOSITORY")}
                    </Button>
                    <Divider orientation="vertical" h="16px" borderColor="ui.border" />
                    <Tooltip label="Research Focus Mode" fontSize="2xs" bg="background.elevated" color="white" borderRadius="xs">
                        <IconButton 
                            aria-label="Toggle Focus Mode" 
                            size="xs" 
                            variant="ghost" 
                            color={preferences.focusMode ? 'brand.500' : 'ui.muted'}
                            icon={<ViewIcon w={3} h={3} />} 
                            onClick={toggleFocusMode} 
                            _hover={{ bg: 'whiteAlpha.100' }}
                        />
                    </Tooltip>
                    <Menu>
                        <MenuButton as={IconButton} size="xs" variant="ghost" icon={<SettingsIcon w={3} h={3} />} color="ui.muted" />
                        <MenuList bg="background.surface" borderColor="ui.border" minW="150px" boxShadow="panel">
                            <MenuItem bg="transparent" _hover={{ bg: 'whiteAlpha.100' }} onClick={toggleColorMode} fontSize="11px">
                                {colorMode === 'light' ? 'Dark Mode' : 'Light Mode'}
                            </MenuItem>
                            <MenuDivider borderColor="ui.border" />
                            <MenuItem bg="transparent" _hover={{ bg: 'whiteAlpha.100' }} onClick={() => changeLanguage('en')} fontSize="11px">
                                English (EN)
                            </MenuItem>
                            <MenuItem bg="transparent" _hover={{ bg: 'whiteAlpha.100' }} onClick={() => changeLanguage('ko')} fontSize="11px">
                                한국어 (KR)
                            </MenuItem>
                            <MenuDivider borderColor="ui.border" />
                            <MenuItem bg="transparent" _hover={{ bg: 'whiteAlpha.100' }} onClick={() => setIsDeveloperMode(!isDeveloperMode)} fontSize="11px" color={isDeveloperMode ? 'brand.500' : 'gray.400'}>
                                {isDeveloperMode ? 'Disable Dev Mode' : 'Enable Dev Mode'}
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </HStack>
                </Flex>
            </Container>
        </Box>

        {/* Main Workspace Area */}
        <Box flex={1} overflow="hidden" position="relative" zIndex={1}>
          <Container maxW="container.2xl" h="100%" py={3}>
            {!isConnected && !isDemoMode ? (
                <WorkspaceWelcome 
                    onImportDemo={handleToggleDemoMode}
                    onNewResearch={() => {
                        setWorkspaceMode('RESEARCH');
                        setIsConnected(true);
                    }}
                    onReviewEvidence={() => {
                        setWorkspaceMode('REVIEW');
                        setIsConnected(true);
                    }}
                />
            ) : (
                <Grid 
                templateColumns={preferences.focusMode ? "1fr" : { base: "1fr", lg: "1fr 340px" }} 
                gap={5} 
                h="100%"
                overflow="hidden"
                >
                {/* Left Content: Scrollable */}
                <Box 
                    h="100%" 
                    overflowY="auto" 
                    pr={1}
                    sx={{
                    '&::-webkit-scrollbar': { width: '3px' },
                    '&::-webkit-scrollbar-thumb': { bg: 'whiteAlpha.100', borderRadius: 'full' }
                    }}
                >
                    <VStack spacing={5} align="stretch" pb={10}>
                    <Grid templateColumns={workspaceMode === 'REVIEW' ? { base: "1fr", xl: "1fr 1fr" } : { base: "1fr", xl: "1fr 320px" }} gap={4}>
                        <Box borderRadius="md" bg={cardBg} borderWidth="1px" borderColor={borderColor} height="520px" overflow="hidden" boxShadow="panel">
                        <PriceChart symbol={selectedSymbol} onSymbolChange={setSelectedSymbol} />
                        </Box>
                        
                        {workspaceMode === 'REVIEW' ? (
                            <Box borderRadius="md" bg={cardBg} borderWidth="1px" borderColor={borderColor} height="520px" overflow="hidden" boxShadow="panel">
                            <PriceChart symbol="ETH/USDT" onSymbolChange={() => {}} />
                            </Box>
                        ) : workspaceMode === 'RESEARCH' ? (
                        <VStack spacing={4} opacity={investigatingSignalId ? 0.3 : 1} transition="opacity 0.2s" pointerEvents={investigatingSignalId ? 'none' : 'auto'}>
                            <Box p={3} borderRadius="md" bg={cardBg} borderWidth="1px" borderColor={borderColor} w="100%" h="250px" overflow="auto" boxShadow="panel">
                            <OrderBook symbol={selectedSymbol} />
                            </Box>
                            <Box p={3} borderRadius="md" bg={cardBg} borderWidth="1px" borderColor={borderColor} w="100%" h="250px" overflow="auto" boxShadow="panel">
                            <TradeHistory trades={[]} />
                            </Box>
                        </VStack>
                        ) : null}
                    </Grid>

                    {(workspaceMode === 'RESEARCH' || workspaceMode === 'REVIEW') && (isConnected || isDemoMode) && (
                        <Box position="relative" zIndex={investigatingSignalId ? 10 : 1}>
                            <ReplayTimeline 
                                symbol={selectedSymbol} 
                                onFocusSignal={handleFocusSignal} 
                                investigatingSignalId={investigatingSignalId}
                                onClearFocus={handleClearFocus}
                            />
                        </Box>
                    )}
                    
                    {workspaceMode === 'RESEARCH' && isConnected && (
                        <Box opacity={investigatingSignalId ? 0.3 : 1} transition="opacity 0.2s" pointerEvents={investigatingSignalId ? 'none' : 'auto'} p={4} borderRadius="md" bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="panel">
                        <TradingForm isTrading={isTrading} onStartTrading={handleStartTrading} onStopTrading={handleStopTrading} symbol={selectedSymbol} onSymbolChange={setSelectedSymbol} />
                        </Box>
                    )}
                    {workspaceMode === 'RESEARCH' && isConnected && (
                        <Box opacity={investigatingSignalId ? 0.3 : 1} transition="opacity 0.2s" pointerEvents={investigatingSignalId ? 'none' : 'auto'} p={4} borderRadius="md" bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="panel">
                        <RepeatTrading isConnected={isConnected} />
                        </Box>
                    )}
                    {(isConnected || isDemoMode) && (
                        <Box opacity={investigatingSignalId ? 0.3 : 1} transition="opacity 0.2s" pointerEvents={investigatingSignalId ? 'none' : 'auto'}>
                            <SignalJournal workspaceMode={workspaceMode} />
                        </Box>
                    )}
                    <Box opacity={investigatingSignalId ? 1 : 0.8} transition="opacity 0.2s">
                        <ResearchNotebook />
                    </Box>
                    </VStack>
                </Box>
                
                {/* Right Sidebar: Independently Scrollable */}
                {!preferences.focusMode && (
                    <Box 
                    h="100%" 
                    overflowY="auto" 
                    pr={1}
                    opacity={investigatingSignalId ? 0.5 : 1}
                    transition="opacity 0.2s"
                    sx={{
                        '&::-webkit-scrollbar': { width: '3px' },
                        '&::-webkit-scrollbar-thumb': { bg: 'whiteAlpha.100', borderRadius: 'full' }
                    }}
                    >
                    <VStack spacing={5} align="stretch" pb={10}>
                        <SidebarSection title={t('sidebar.guidance')} defaultOpen={workspaceMode === 'TRAINING'}>
                            <VStack spacing={3} align="stretch">
                                <ResearchWorkflowGuide onModeChange={setWorkspaceMode} />
                                {workspaceMode === 'TRAINING' && <GuidedWalkthrough workspaceMode={workspaceMode} />}
                                {workspaceMode === 'TRAINING' && <LearningPathManager />}
                            </VStack>
                        </SidebarSection>

                        <SidebarSection title={lang === 'ko' ? "연구 및 실험" : "INVESTIGATION"} defaultOpen={workspaceMode === 'RESEARCH'}>
                            <VStack spacing={3} align="stretch">
                                {workspaceMode === 'RESEARCH' && (
                                    <ExchangeSettings selectedExchange={selectedExchange} setSelectedExchange={setSelectedExchange} apiKey={apiKey} setApiKey={setApiKey} secretKey={secretKey} setSecretKey={setSecretKey} showApiInput={showApiInput} setShowApiInput={setShowApiInput} isConnected={isConnected} onConnect={handleConnect} onDisconnect={handleDisconnect} onTestConnection={handleTestConnection} onLoadEnvKeys={handleLoadEnvKeys} onSettingsUpdate={() => {}} isDeveloperMode={isDeveloperMode} testMode={testMode} setTestMode={setTestMode} />
                                )}
                                <ResearchSessionManager />
                                <HypothesisManager investigatingSignalId={investigatingSignalId} />
                                <PersonaSandbox symbol={selectedSymbol} workspaceMode={workspaceMode} />
                            </VStack>
                        </SidebarSection>
                        
                        <SidebarSection title={t('sidebar.knowledge')} defaultOpen={true}>
                            <VStack spacing={3} align="stretch">
                                <ResearchNotebook />
                                {workspaceMode === 'REVIEW' && <ResearchCommentary />}
                                {workspaceMode === 'REVIEW' && <MultiPerspectiveReview />}
                                {workspaceMode === 'REVIEW' && <ResearchReviewBoard />}
                            </VStack>
                        </SidebarSection>

                        <SidebarSection title={lang === 'ko' ? "데이터 보관 및 안전" : "ARCHIVES & SAFETY"} defaultOpen={workspaceMode === 'REVIEW'}>
                            <VStack spacing={3} align="stretch">
                                <ResearchArchiveManager />
                                {workspaceMode === 'REVIEW' && <ReplaySnapshotManager symbol={selectedSymbol} />}
                                {workspaceMode === 'REVIEW' && <CollaborativeGovernance />}
                                {workspaceMode === 'REVIEW' && <ReliabilityDashboard />}
                                {workspaceMode === 'RESEARCH' && <PerformanceMetrics />}
                            </VStack>
                        </SidebarSection>
                    </VStack>
                    </Box>
                )}
                </Grid>
            )}
          </Container>
        </Box>
      </Flex>
    </ChakraProvider>
  );
};

export default App;
