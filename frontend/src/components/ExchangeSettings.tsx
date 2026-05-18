import React, { useState } from 'react';
import { demoFetch } from "../demo/demoFetch";
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
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [assetType, setAssetType] = useState('CRYPTO');
  const toast = useToast();

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const response = await demoFetch('http://localhost:8000/select-market', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: selectedExchange,
          asset_type: assetType,
          api_key: apiKey,
          secret: secretKey,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast({
          title: 'Research Environment Ready',
          description: data.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onSettingsUpdate();
      } else {
        toast({
          title: 'Initialization Failed',
          description: data.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: 'Error',
        description: 'Failed to communicate with research workstation.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const response = await demoFetch('http://localhost:8000/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exchange_name: selectedExchange,
          api_key: apiKey,
          secret: secretKey,
        }),
      });

      const data = await response.json();
      toast({
        title: data.status === 'success' ? 'Access Validated' : 'Validation Failed',
        description: data.message,
        status: data.status === 'success' ? 'success' : 'error',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const response = await demoFetch('http://localhost:8000/disconnect-exchange', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.status === 'success') {
        setApiKey('');
        setSecretKey('');
        setShowApiInput(false);
        toast({
          title: 'Data Feed Detached',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        onSettingsUpdate();
      }
    } catch (error) {
      console.error('Disconnect error:', error);
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
            <option value="CRYPTO">Crypto Assets (CCXT)</option>
            <option value="STOCK">Equities (Simulated)</option>
            <option value="ETF">Global ETFs (Simulated)</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="10px" color="ui.muted" fontWeight="800" textTransform="uppercase" letterSpacing="widest">Research Data Provider</FormLabel>
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
          >
            CONFIGURE DATA ACCESS
          </Button>
        ) : null}

        {showApiInput && (
          <>
            <FormControl>
              <FormLabel fontSize="10px" color="ui.muted" fontWeight="800" textTransform="uppercase" letterSpacing="widest">Provider API Key</FormLabel>
              <Input
                type="password"
                value={apiKey}
                placeholder="Required for direct feed access"
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
              <FormLabel fontSize="10px" color="ui.muted" fontWeight="800" textTransform="uppercase" letterSpacing="widest">Provider Secret</FormLabel>
              <Input
                type="password"
                value={secretKey}
                placeholder="Secure analytical token"
                onChange={(e) => setSecretKey(e.target.value)}
                isDisabled={isConnected}
                bg="background.deep"
                borderColor="ui.border"
                size="xs"
                borderRadius="xs"
                fontSize="11px"
              />
            </FormControl>

            <Text fontSize="9px" color="ui.muted" fontStyle="italic">
              * Research integrity: All orders remain in simulation mode.
            </Text>

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
              >
                {isLoading ? <Spinner size="2xs" /> : "INITIALIZE RESEARCH FEED"}
              </Button>

              <Button
                variant="ghost"
                colorScheme="gray"
                onClick={handleTestConnection}
                isDisabled={!apiKey || !secretKey || isLoading}
                width="100%"
                size="xs"
                fontSize="10px"
              >
                {isLoading ? <Spinner size="2xs" /> : 'Validate Analytical Stream'}
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
          >
            {isLoading ? <Spinner size="2xs" /> : "DETACH RESEARCH DATA"}
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default ExchangeSettings;
