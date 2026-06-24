import React, { useState } from 'react';
import { demoFetch } from "../demo/demoFetch";
import { API_BASE_URL } from '../config/api';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  useToast,
  Text,
  Divider,
  HStack,
  Spinner,
} from '@chakra-ui/react';
import { useI18n } from '../i18n';

interface ExchangeSettingsProps {
  selectedExchange: string;
  setSelectedExchange: (exchange: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  secretKey: string;
  setSecretKey: (key: string) => void;
  showApiInput: boolean;
  setShowApiInput: (show: boolean) => void;
  isConnected: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onTestConnection: () => Promise<void>;
  onLoadEnvKeys: () => Promise<void>;
  onSettingsUpdate: () => void;
  isDeveloperMode: boolean;
  testMode: boolean;
  setTestMode: (mode: boolean) => void;
}

const ExchangeSettings: React.FC<ExchangeSettingsProps> = ({
  selectedExchange,
  setSelectedExchange,
  apiKey,
  setApiKey,
  secretKey,
  setSecretKey,
  showApiInput,
  setShowApiInput,
  isConnected,
  onConnect,
  onDisconnect,
  onTestConnection,
  onLoadEnvKeys,
  onSettingsUpdate,
  isDeveloperMode,
  testMode,
  setTestMode,
}) => {
  const { lang, t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [assetType, setAssetType] = useState('CRYPTO');
  const toast = useToast();

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await onConnect();
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      await onTestConnection();
    } catch (error) {
      console.error('Test connection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await onDisconnect();
    } catch (error) {
      console.error('Disconnect error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadEnvKeys = async () => {
    setIsLoading(true);
    try {
      await onLoadEnvKeys();
    } catch (error) {
      console.error('Load env keys error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="md" bg="blackAlpha.300" borderColor="ui.border">
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel fontSize="10px" color="ui.muted" fontWeight="800" textTransform="uppercase" letterSpacing="widest">{t('label.asset_type')}</FormLabel>
          <Select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            isDisabled={isConnected}
            bg="background.deep"
            borderColor="ui.border"
            size="xs"
            borderRadius="xs"
            fontSize="11px"
          >
            <option value="CRYPTO">{lang === 'ko' ? "가상자산 (CCXT)" : "Crypto Assets (CCXT)"}</option>
            <option value="STOCK">{lang === 'ko' ? "주식 (시뮬레이션)" : "Equities (Simulated)"}</option>
            <option value="ETF">{lang === 'ko' ? "글로벌 ETF (시뮬레이션)" : "Global ETFs (Simulated)"}</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="10px" color="ui.muted" fontWeight="800" textTransform="uppercase" letterSpacing="widest">
              {lang === 'ko' ? "연구용 데이터 소스" : "Research Data Provider"}
          </FormLabel>
          <Select
            value={selectedExchange}
            onChange={(e) => setSelectedExchange(e.target.value)}
            isDisabled={isConnected}
            bg="background.deep"
            borderColor="ui.border"
            size="xs"
            borderRadius="xs"
            fontSize="11px"
          >
            <option value="binance">Binance</option>
            <option value="digifinex">Digifinex</option>
            <option value="weex">Weex</option>
            <option value="yahoo">Yahoo Finance (Restricted)</option>
          </Select>
        </FormControl>

        {!isConnected && !showApiInput ? (
          <Button
            variant="outline"
            colorScheme="brand"
            onClick={() => setShowApiInput(true)}
            width="100%"
            size="xs"
            fontSize="10px"
            letterSpacing="wider"
            fontWeight="800"
            borderRadius="xs"
          >
            {lang === 'ko' ? "데이터 연동 설정" : "CONFIGURE DATA ACCESS"}
          </Button>
        ) : null}

        {showApiInput && (
          <>
            <FormControl>
              <HStack justify="space-between" width="100%" mb={1}>
                <FormLabel fontSize="10px" color="ui.muted" fontWeight="800" textTransform="uppercase" letterSpacing="widest" m={0}>
                    {lang === 'ko' ? "API 키 (읽기 전용)" : "READ-ONLY ACCESS KEY"}
                </FormLabel>
                <Button
                  variant="link"
                  size="xs"
                  fontSize="10px"
                  colorScheme="brand"
                  onClick={handleLoadEnvKeys}
                  isDisabled={isConnected || isLoading}
                  height="auto"
                  minW="auto"
                  _hover={{ textDecoration: 'none', color: 'brand.400' }}
                >
                  {lang === 'ko' ? ".env에서 로드" : "Load from .env"}
                </Button>
              </HStack>
              <Input
                type="password"
                value={apiKey}
                placeholder={lang === 'ko' ? "공개 피드의 경우 선택 사항" : "Optional for public feeds"}
                onChange={(e) => setApiKey(e.target.value)}
                isDisabled={isConnected}
                bg="background.deep"
                borderColor="ui.border"
                size="xs"
                borderRadius="xs"
                fontSize="11px"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="10px" color="ui.muted" fontWeight="800" textTransform="uppercase" letterSpacing="widest">
                  {lang === 'ko' ? "시크릿 키 (읽기 전용)" : "READ-ONLY TOKEN"}
              </FormLabel>
              <Input
                type="password"
                value={secretKey}
                placeholder={lang === 'ko' ? "분석용 보안 토큰" : "Secure analytical token"}
                onChange={(e) => setSecretKey(e.target.value)}
                isDisabled={isConnected}
                bg="background.deep"
                borderColor="ui.border"
                size="xs"
                borderRadius="xs"
                fontSize="11px"
              />
            </FormControl>

            <VStack align="start" spacing={1} p={2} bg="blackAlpha.400" borderRadius="xs" border="1px solid" borderColor="ui.border">
              <Text fontSize="9px" color="brand.500" fontWeight="800">{lang === 'ko' ? "시뮬레이션 원칙" : "SIMULATION MANDATE"}</Text>
              <Text fontSize="9px" color="ui.muted" fontStyle="italic" lineHeight="short">
                {lang === 'ko' 
                    ? "PaperQuantLab은 실제 거래를 수행하지 않습니다. 모든 시장 데이터 연동은 연구 및 리플레이를 위해서만 사용됩니다."
                    : "PaperQuantLab does not execute live trades. Market data access is for research and replay only."
                }
              </Text>
            </VStack>

            <Divider borderColor="whiteAlpha.100" />

            <VStack spacing={2} width="100%">
              <Button
                colorScheme="brand"
                onClick={handleConnect}
                isDisabled={isConnected || isLoading}
                width="100%"
                size="xs"
                fontWeight="800"
                letterSpacing="wider"
                borderRadius="xs"
              >
                {isLoading ? <Spinner size="2xs" /> : (lang === 'ko' ? "연구 피드 연결" : "ATTACH READ-ONLY DATA SOURCE")}
              </Button>

              <Button
                variant="ghost"
                colorScheme="gray"
                onClick={handleTestConnection}
                isDisabled={!apiKey || !secretKey || isLoading}
                width="100%"
                size="xs"
                fontSize="10px"
                borderRadius="xs"
              >
                {isLoading ? <Spinner size="2xs" /> : (lang === 'ko' ? '연동 테스트' : 'Validate Analytical Feed')}
              </Button>
            </VStack>
          </>
        )}

        {isConnected && (
          <Button
            variant="ghost"
            colorScheme="red"
            onClick={handleDisconnect}
            isDisabled={!isConnected || isLoading}
            width="100%"
            size="xs"
            fontSize="10px"
            fontWeight="800"
            letterSpacing="wider"
            borderRadius="xs"
          >
            {isLoading ? <Spinner size="2xs" /> : (lang === 'ko' ? "데이터 피드 연결 해제" : "DETACH DATA SOURCE")}
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default ExchangeSettings;
