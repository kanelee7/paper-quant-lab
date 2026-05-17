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
  } from '@chakra-ui/react';

import { SunIcon, MoonIcon, ChevronUpIcon, ChevronDownIcon, ViewIcon } from '@chakra-ui/icons';
import OrderBook from './components/OrderBook';
import TradeHistory from './components/TradeHistory';
import TradingForm from './components/TradingForm';
import PriceChart from './components/PriceChart';
import ExchangeSettings from './components/ExchangeSettings';
import theme from './theme';
import RepeatTrading from './components/RepeatTrading';
import SignalJournal from './components/SignalJournal';
import ResearchJournal from './components/ResearchJournal';
import PerformanceMetrics from './components/PerformanceMetrics';
import QuantInsights from './components/QuantInsights';
import PersonaSandbox from './components/PersonaSandbox';
import ResearchSessionManager from './components/ResearchSessionManager';
import ResearchKnowledgeBase from './components/ResearchKnowledgeBase';
import ResearchDiscovery from './components/ResearchDiscovery';
import ResearchCommentary from './components/ResearchCommentary';
import ReliabilityDashboard from './components/ReliabilityDashboard';
import CollaborativeGovernance from './components/CollaborativeGovernance';
import ResearchArchiveManager from './components/ResearchArchiveManager';
import ResearchReviewBoard from './components/ResearchReviewBoard';
import ResearchWorkflowGuide from './components/ResearchWorkflowGuide';
import ComparativeStudyBoard from './components/ComparativeStudyBoard';
import MultiPerspectiveReview from './components/MultiPerspectiveReview';
import ReplayTimeline from './components/ReplayTimeline';
import ReplaySnapshotManager from './components/ReplaySnapshotManager';
import GuidedWalkthrough from './components/GuidedWalkthrough';
import WorkspaceOnboarding from './components/WorkspaceOnboarding';
import LearningPathManager from './components/LearningPathManager';
import Landing from './pages/Landing';
import Vision from './pages/Vision';
import Philosophy from './pages/Philosophy';
import { useI18n } from './i18n';
import { usePreferences } from './hooks/usePreferences';
import CommandPalette from './components/CommandPalette';

const SidebarSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: defaultOpen });
  return (
    <VStack align="stretch" spacing={2} bg="blackAlpha.200" p={2} borderRadius="md" borderWidth="1px" borderColor="ui.border">
      <HStack 
        justifyContent="space-between" 
        cursor="pointer" 
        onClick={onToggle}
        px={1}
      >
        <Text fontSize="10px" fontWeight="800" color="ui.muted" letterSpacing="0.1em">{title}</Text>
        <IconButton 
            size="2xs" 
            variant="ghost" 
            icon={isOpen ? <ChevronUpIcon w={3} h={3} /> : <ChevronDownIcon w={3} h={3} />} 
            aria-label="Toggle Section" 
        />
      </HStack>
      <Collapse in={isOpen}>
        <VStack align="stretch" spacing={4} pt={2}>
          {children}
        </VStack>
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
  
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('gray.50', 'background.deep');
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

  const handleFocusSignal = (signal: any) => {
    const event = new CustomEvent('focus-chart', {
      detail: { timestamp: new Date(signal.timestamp).getTime() }
    });
    window.dispatchEvent(event);
  };

  const handleStartTrading = async () => {
    try {
      const response = await fetch('http://localhost:8000/auto-trading/start', {
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
      const response = await fetch('http://localhost:8000/auto-trading/stop', { method: 'POST' });
      const data = await response.json();
      if (data.status === 'success') {
        setIsTrading(false);
        toast({ title: 'Simulation Stopped', status: 'info' });
      }
    } catch (e) {}
  };

  const handleConnect = async () => {
    try {
      const response = await fetch('http://localhost:8000/select-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exchange: selectedExchange, api_key: apiKey, secret: secretKey, test_mode: testMode }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setIsConnected(true);
        setShowApiInput(false);
        toast({ title: 'Market Connected', status: 'success' });
      }
    } catch (e) {}
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('http://localhost:8000/disconnect', { method: 'POST' });
      const data = await response.json();
      if (data.status === 'success') {
        setIsConnected(false);
        toast({ title: 'Market Disconnected', status: 'info' });
      }
    } catch (e) {}
  };

  if (currentPage === 'LANDING') {
    return (
      <ChakraProvider theme={theme}>
        <Landing onLaunch={handleLaunchWorkstation} onNavigate={handleNavigate} />
      </ChakraProvider>
    );
  }

  if (currentPage === 'VISION') {
    return (
      <ChakraProvider theme={theme}>
        <Vision onBack={handleBackToLanding} />
      </ChakraProvider>
    );
  }

  if (currentPage === 'PHILOSOPHY') {
    return (
      <ChakraProvider theme={theme}>
        <Philosophy onBack={handleBackToLanding} />
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={theme}>
      <WorkspaceOnboarding />
      <CommandPalette onModeChange={setWorkspaceMode} onFocusModeToggle={toggleFocusMode} />
      <Box minH="100vh" bg={bgColor}>
        <Box borderBottom="1px" borderColor={borderColor} bg="background.surface" position="sticky" top={0} zIndex={10} boxShadow="sm">
            <Container maxW="container.2xl" py={2}>
                <Flex justifyContent="space-between" alignItems="center">
                <HStack spacing={6}>
                    <HStack spacing={2} cursor="pointer" onClick={handleBackToLanding}>
                        <Box w={2} h={2} bg="brand.500" borderRadius="full" />
                        <Heading size="sm" letterSpacing="tight">PaperQuantLab</Heading>
                    </HStack>
                    <Divider orientation="vertical" h="16px" borderColor="ui.border" />
                    <HStack bg="blackAlpha.400" p={0.5} borderRadius="sm" borderWidth="1px" borderColor="ui.border">
                        <Button size="2xs" variant={workspaceMode === 'RESEARCH' ? 'solid' : 'ghost'} colorScheme={workspaceMode === 'RESEARCH' ? 'brand' : 'gray'} onClick={() => setWorkspaceMode('RESEARCH')}>{t('nav.research')}</Button>
                        <Button size="2xs" variant={workspaceMode === 'REVIEW' ? 'solid' : 'ghost'} colorScheme={workspaceMode === 'REVIEW' ? 'pink' : 'gray'} onClick={() => setWorkspaceMode('REVIEW')}>{t('nav.review')}</Button>
                        <Button size="2xs" variant={workspaceMode === 'TRAINING' ? 'solid' : 'ghost'} colorScheme={workspaceMode === 'TRAINING' ? 'green' : 'gray'} onClick={() => setWorkspaceMode('TRAINING')}>{t('nav.training')}</Button>
                    </HStack>
                </HStack>
                <HStack spacing={4}>
                    <HStack bg="blackAlpha.300" p={1} borderRadius="md" borderWidth="1px" borderColor="ui.border">
                        <Button size="2xs" variant={lang === 'en' ? 'solid' : 'ghost'} onClick={() => changeLanguage('en')}>EN</Button>
                        <Button size="2xs" variant={lang === 'ko' ? 'solid' : 'ghost'} onClick={() => changeLanguage('ko')}>KR</Button>
                    </HStack>
                    <IconButton 
                        aria-label="Toggle Focus Mode" 
                        size="xs" 
                        variant={preferences.focusMode ? 'solid' : 'ghost'} 
                        colorScheme={preferences.focusMode ? 'brand' : 'gray'}
                        icon={<ViewIcon />} 
                        onClick={toggleFocusMode} 
                    />
                    <IconButton aria-label="Toggle color mode" size="xs" variant="ghost" icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />} onClick={toggleColorMode} />
                    <Button size="xs" onClick={() => setIsDeveloperMode(!isDeveloperMode)} colorScheme={isDeveloperMode ? 'brand' : 'gray'} variant="ghost" fontSize="10px" fontWeight="800">
                        {isDeveloperMode ? 'DEV MODE' : 'USER MODE'}
                    </Button>
                </HStack>
                </Flex>
            </Container>
        </Box>

        <Container maxW="container.2xl" py={4}>
          <Grid templateColumns={preferences.focusMode ? "1fr" : { base: "1fr", lg: "1fr 360px" }} gap={6}>
            <Box>
              <VStack spacing={6} align="stretch">
                <Grid templateColumns={workspaceMode === 'REVIEW' ? { base: "1fr", xl: "1fr 1fr" } : { base: "1fr", xl: "1fr 320px" }} gap={4}>
                  <Box borderRadius="md" bg={cardBg} borderWidth="1px" borderColor={borderColor} height="600px" overflow="hidden" boxShadow="panel">
                    <PriceChart symbol={selectedSymbol} onSymbolChange={setSelectedSymbol} />
                  </Box>
                  
                  {workspaceMode === 'REVIEW' ? (
                      <Box borderRadius="md" bg={cardBg} borderWidth="1px" borderColor={borderColor} height="600px" overflow="hidden" boxShadow="panel">
                         <PriceChart symbol="ETH/USDT" onSymbolChange={() => {}} />
                      </Box>
                  ) : workspaceMode === 'RESEARCH' ? (
                    <VStack spacing={4}>
                        <Box p={4} borderRadius="md" bg={cardBg} borderWidth="1px" borderColor={borderColor} w="100%" h="290px" overflow="auto" boxShadow="panel">
                        <OrderBook symbol={selectedSymbol} />
                        </Box>
                        <Box p={4} borderRadius="md" bg={cardBg} borderWidth="1px" borderColor={borderColor} w="100%" h="290px" overflow="auto" boxShadow="panel">
                        <TradeHistory trades={[]} />
                        </Box>
                    </VStack>
                  ) : null}
                </Grid>

                {workspaceMode === 'RESEARCH' && isConnected && (
                    <ReplayTimeline symbol={selectedSymbol} onFocusSignal={handleFocusSignal} />
                )}
                
                {workspaceMode === 'RESEARCH' && isConnected && (
                  <Box p={4} borderRadius="md" bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="panel">
                    <TradingForm isTrading={isTrading} onStartTrading={handleStartTrading} onStopTrading={handleStopTrading} symbol={selectedSymbol} onSymbolChange={setSelectedSymbol} />
                  </Box>
                )}
                {workspaceMode === 'RESEARCH' && isConnected && (
                  <Box p={4} borderRadius="md" bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="panel">
                    <RepeatTrading isConnected={isConnected} />
                  </Box>
                )}
                {isConnected && (
                    <SignalJournal workspaceMode={workspaceMode} />
                )}
                <ResearchJournal />
              </VStack>
            </Box>
            
            {!preferences.focusMode && (
              <Box>
                <VStack spacing={6} align="stretch">
                  <SidebarSection title={t('sidebar.guidance')}>
                      <VStack spacing={4} align="stretch">
                        <LearningPathManager />
                        <ResearchWorkflowGuide onModeChange={setWorkspaceMode} />
                        <GuidedWalkthrough workspaceMode={workspaceMode} />
                      </VStack>
                  </SidebarSection>

                  {workspaceMode === 'RESEARCH' && (
                    <SidebarSection title={t('sidebar.experimentation')}>
                        <Box p={4} borderRadius="md" bg="blackAlpha.300" borderWidth="1px" borderColor="ui.border">
                          <ExchangeSettings selectedExchange={selectedExchange} setSelectedExchange={setSelectedExchange} apiKey={apiKey} setApiKey={setApiKey} secretKey={secretKey} setSecretKey={setSecretKey} showApiInput={showApiInput} setShowApiInput={setShowApiInput} isConnected={isConnected} onConnect={handleConnect} onDisconnect={handleDisconnect} onTestConnection={async () => {}} onLoadEnvKeys={async () => {}} onSettingsUpdate={() => {}} isDeveloperMode={isDeveloperMode} testMode={testMode} setTestMode={setTestMode} />
                        </Box>
                        <ResearchSessionManager />
                        <PersonaSandbox symbol={selectedSymbol} workspaceMode={workspaceMode} />
                    </SidebarSection>
                  )}
                  <SidebarSection title={t('sidebar.knowledge')}>
                      <VStack spacing={4} align="stretch">
                          <ResearchDiscovery />
                          <ResearchCommentary />
                          <MultiPerspectiveReview />
                          <ResearchKnowledgeBase />
                          <ResearchReviewBoard />
                          <ComparativeStudyBoard />
                          <QuantInsights />
                      </VStack>
                  </SidebarSection>
                  <SidebarSection title={t('sidebar.reliability')} defaultOpen={workspaceMode === 'REVIEW'}>
                      <VStack spacing={4} align="stretch">
                        <ReplaySnapshotManager symbol={selectedSymbol} />
                        <CollaborativeGovernance />
                        <ReliabilityDashboard />
                        {workspaceMode === 'RESEARCH' && (
                            <>
                              <ResearchArchiveManager />
                              <PerformanceMetrics />
                            </>
                        )}
                      </VStack>
                  </SidebarSection>
                </VStack>
              </Box>
            )}
          </Grid>
        </Container>
      </Box>
    </ChakraProvider>
  );
};

export default App;
