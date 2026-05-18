import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  IconButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Tooltip,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ArrowLeftIcon, 
  ArrowRightIcon,
  SearchIcon 
} from '@chakra-ui/icons';
import { demoFetch } from "../demo/demoFetch";

interface Signal {
  id: string;
  timestamp: string;
  action: string;
  persona_id?: string;
  market_regime?: string;
  price: number;
}

interface ReplayTimelineProps {
  symbol: string;
  onFocusSignal: (signal: Signal) => void;
}

const ReplayTimeline: React.FC<ReplayTimelineProps> = ({ symbol, onFocusSignal }) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [currentIndex, setCurrentStepIndex] = useState(-1);
  const [sliderValue, setSliderValue] = useState(0);

  useEffect(() => {
    fetchSignals();
  }, [symbol]);

  const fetchSignals = async () => {
    try {
      const response = await demoFetch(`http://localhost:8000/api/journal?limit=200`);
      const data = await response.json();
      const filtered = data.filter((s: any) => s.symbol === symbol).sort((a: any, b: any) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setSignals(filtered);
      if (filtered.length > 0) {
          setCurrentStepIndex(filtered.length - 1);
          setSliderValue(filtered.length - 1);
      }
    } catch (error) {
      console.error('Failed to fetch signals for timeline:', error);
    }
  };

  const handleSliderChange = (val: number) => {
    setSliderValue(val);
    if (signals[val]) {
        setCurrentStepIndex(val);
        onFocusSignal(signals[val]);
    }
  };

  const jumpToPrevious = () => {
    if (currentIndex > 0) {
        handleSliderChange(currentIndex - 1);
    }
  };

  const jumpToNext = () => {
    if (currentIndex < signals.length - 1) {
        handleSliderChange(currentIndex + 1);
    }
  };

  if (signals.length === 0) return null;

  const currentSignal = signals[currentIndex];

  return (
    <Box 
        bg="background.surface" 
        p={3} 
        borderRadius="md" 
        borderWidth="1px" 
        borderColor="ui.border"
        boxShadow="panel"
    >
      <VStack spacing={4} align="stretch">
        <HStack justifyContent="space-between" px={2}>
            <HStack spacing={4}>
                <Text fontSize="10px" fontWeight="800" color="ui.muted" letterSpacing="widest">REPLAY TIMELINE</Text>
                <HStack spacing={1}>
                    <IconButton 
                        size="2xs" 
                        variant="ghost" 
                        icon={<ArrowLeftIcon w={2} h={2} />} 
                        aria-label="First" 
                        onClick={() => handleSliderChange(0)} 
                    />
                    <IconButton 
                        size="2xs" 
                        variant="ghost" 
                        icon={<ChevronLeftIcon w={4} h={4} />} 
                        aria-label="Prev" 
                        onClick={jumpToPrevious} 
                    />
                    <Text fontSize="xs" fontWeight="bold" fontFamily="mono" minW="60px" textAlign="center">
                        {currentIndex + 1} / {signals.length}
                    </Text>
                    <IconButton 
                        size="2xs" 
                        variant="ghost" 
                        icon={<ChevronRightIcon w={4} h={4} />} 
                        aria-label="Next" 
                        onClick={jumpToNext} 
                    />
                    <IconButton 
                        size="2xs" 
                        variant="ghost" 
                        icon={<ArrowRightIcon w={2} h={2} />} 
                        aria-label="Last" 
                        onClick={() => handleSliderChange(signals.length - 1)} 
                    />
                </HStack>
            </HStack>

            {currentSignal && (
                <HStack spacing={3}>
                    <Badge colorScheme={currentSignal.action === 'buy' ? 'green' : 'red'} variant="subtle" fontSize="9px">
                        {currentSignal.action.toUpperCase()} @ {currentSignal.price.toLocaleString()}
                    </Badge>
                    <Badge variant="outline" fontSize="9px" color="ui.muted">
                        {new Date(currentSignal.timestamp).toLocaleTimeString()}
                    </Badge>
                    <IconButton 
                        size="2xs" 
                        colorScheme="brand" 
                        icon={<SearchIcon w={2} h={2} />} 
                        aria-label="Inspect Detail" 
                        onClick={() => {
                            const event = new CustomEvent('open-signal-detail', { detail: { signalId: currentSignal.id } });
                            window.dispatchEvent(event);
                        }}
                    />
                </HStack>
            )}
        </HStack>

        <Box px={6} py={2}>
            <Slider
                aria-label="replay-scrubber"
                min={0}
                max={signals.length - 1}
                step={1}
                value={sliderValue}
                onChange={handleSliderChange}
                focusThumbOnChange={false}
            >
                <SliderTrack bg="blackAlpha.400" h="4px">
                    <SliderFilledTrack bg="brand.500" />
                </SliderTrack>
                {(signals || []).map((s, idx) => (
                    <SliderMark
                        key={s.id}
                        value={idx}
                        mt='1'
                        ml='-1'
                        fontSize='xs'
                    >
                        <Box 
                            w="2px" 
                            h="6px" 
                            bg={s.action === 'buy' ? 'status.success' : 'status.error'} 
                            opacity={0.5}
                            borderRadius="full"
                        />
                    </SliderMark>
                ))}
                <SliderThumb boxSize={4} bg="brand.500" borderWidth="2px" borderColor="background.deep" _focus={{ boxShadow: 'glow' }}>
                    <Box color="background.deep" as={ChevronRightIcon} w={3} h={3} />
                </SliderThumb>
            </Slider>
        </Box>
      </VStack>
    </Box>
  );
};

export default ReplayTimeline;
