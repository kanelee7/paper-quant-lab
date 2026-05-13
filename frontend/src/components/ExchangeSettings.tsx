import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  VStack,
  useToast,
  Text,
  Divider,
  HStack,
  Spinner,
} from '@chakra-ui/react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [assetType, setAssetType] = useState('CRYPTO');
  const toast = useToast();

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/select-market', {
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
          title: 'Research Session Initialized',
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
      const response = await fetch('http://localhost:8000/test-connection', {
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
        title: data.status === 'success' ? 'API Key Valid' : 'Test Failed',
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
      const response = await fetch('http://localhost:8000/disconnect-exchange', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.status === 'success') {
        setApiKey('');
        setSecretKey('');
        setShowApiInput(false);
        toast({
          title: 'Session Disconnected',
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
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="gray.800">
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel fontSize="xs" color="gray.400">RESEARCH ASSET TYPE</FormLabel>
          <Select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            isDisabled={isConnected}
            bg="gray.700"
            borderColor="gray.600"
            size="sm"
          >
            <option value="CRYPTO">Crypto (CCXT)</option>
            <option value="STOCK">US Stocks (Simulated)</option>
            <option value="ETF">Global ETFs (Simulated)</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="xs" color="gray.400">DATA PROVIDER</FormLabel>
          <Select
            value={selectedExchange}
            onChange={(e) => setSelectedExchange(e.target.value)}
            isDisabled={isConnected}
            bg="gray.700"
            borderColor="gray.600"
            size="sm"
          >
            <option value="binance">Binance</option>
            <option value="digifinex">Digifinex</option>
            <option value="weex">Weex</option>
            <option value="yahoo">Yahoo Finance (Coming soon)</option>
          </Select>
        </FormControl>

        {!isConnected && !showApiInput ? (
          <Button
            colorScheme="blue"
            onClick={() => setShowApiInput(true)}
            width="100%"
            size="sm"
          >
            Enter API Credentials (Optional)
          </Button>
        ) : null}

        {showApiInput && (
          <>
            <FormControl>
              <FormLabel fontSize="xs" color="gray.400">API Key</FormLabel>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                isDisabled={isConnected}
                bg="gray.700"
                borderColor="gray.600"
                size="sm"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" color="gray.400">Secret Key</FormLabel>
              <Input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                isDisabled={isConnected}
                bg="gray.700"
                borderColor="gray.600"
                size="sm"
              />
            </FormControl>

            <Text fontSize="xs" color="blue.300">
              * Paper trading is enabled by default for all sessions.
            </Text>

            <Divider />

            <HStack spacing={4} justify="space-between">
              <Button
                colorScheme="blue"
                onClick={handleConnect}
                isDisabled={isConnected || isLoading}
                width="100%"
                size="sm"
              >
                {isLoading ? <Spinner size="xs" /> : 'Start Session'}
              </Button>

              <Button
                colorScheme="gray"
                onClick={handleTestConnection}
                isDisabled={!apiKey || !secretKey || isLoading}
                width="100%"
                size="sm"
              >
                {isLoading ? <Spinner size="xs" /> : 'Test Provider'}
              </Button>
            </HStack>
          </>
        )}

        {isConnected && (
          <Button
            colorScheme="red"
            onClick={handleDisconnect}
            isDisabled={!isConnected || isLoading}
            width="100%"
            size="sm"
          >
            {isLoading ? <Spinner size="xs" /> : 'End Session'}
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default ExchangeSettings;
