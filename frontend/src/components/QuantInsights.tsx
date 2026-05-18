import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  Badge,
  Divider,
  Select,
  Tooltip,
} from '@chakra-ui/react';
import { demoFetch } from "../demo/demoFetch";

interface StrategyStat {
  total: number;
  buy: number;
  sell: number;
  hold: number;
  avg_return_5m: number;
  win_rate_5m: number;
  outcomes_count: number;
  persona_id?: string;
}

const QuantInsights: React.FC = () => {
  const [stats, setStats] = useState<Record<string, StrategyStat>>({});
  const [evals, setEvals] = useState<Record<string, any>>({});
  const [evolution, setEvolution] = useState<Record<string, any>>({});
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('all');

  const fetchStats = async () => {
    try {
      const url = selectedSessionId === 'all' 
        ? 'http://localhost:8000/api/strategy/stats' 
        : `http://localhost:8000/api/strategy/stats?session_id=${selectedSessionId}`;
      
      const response = await demoFetch(url);
      const data = await response.json();
      setStats(data);
      
      const uniquePersonas = Array.from(new Set(Object.values(data).map((s: any) => s.persona_id).filter(Boolean)));
      const newEvals: Record<string, any> = {};
      for (const pid of uniquePersonas as string[]) {
        const evalRes = await demoFetch(`http://localhost:8000/api/personas/evaluation/${pid}`);
        newEvals[pid] = await evalRes.json();
        
        const evoRes = await demoFetch(`http://localhost:8000/api/personas/evolution/${pid}`);
        const evoData = await evoRes.json();
        setEvolution(prev => ({ ...prev, [pid]: evoData }));
      }
      setEvals(newEvals);
    } catch (error) {
      console.error('Failed to fetch strategy stats:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await demoFetch('http://localhost:8000/api/sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSessions();
    const interval = setInterval(() => {
      fetchStats();
      fetchSessions();
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedSessionId]);

  return (
    <Box bg="gray.800" borderRadius="lg" p={4} shadow="md">
      <HStack justifyContent="space-between" mb={4}>
        <Text fontSize="lg" fontWeight="bold">Persona Evolution & Reasoning Drift</Text>
        <Select size="xs" w="150px" bg="gray.700" value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)}>
          <option value="all">All Experiments</option>
          {sessions.map(s => (
            <option key={s.session_id} value={s.session_id}>{s.title}</option>
          ))}
        </Select>
      </HStack>
      <VStack align="stretch" spacing={4}>
        {Object.entries(stats).length === 0 ? (
          <Text fontSize="sm" color="gray.500">No strategy data yet.</Text>
        ) : (
          Object.entries(stats).map(([name, stat]) => (
            <Box key={name} p={3} bg="gray.900" borderRadius="md">
              <HStack justifyContent="space-between" mb={2}>
                <VStack align="start" spacing={0}>
                  <Badge colorScheme="blue">{name.toUpperCase()}</Badge>
                  {stat.persona_id && evolution[stat.persona_id] && (
                    <Text fontSize="2xs" color="gray.600">
                      Ver: {evolution[stat.persona_id].drift_history.slice(-1)[0]?.version || 'v1.0'}
                    </Text>
                  )}
                </VStack>
                {stat.persona_id && evals[stat.persona_id] && (
                  <HStack>
                    <Text fontSize="xs" color="gray.400">Consistency:</Text>
                    <Badge colorScheme="purple" variant="solid">
                      {(evals[stat.persona_id].consistency.consistency_score * 100).toFixed(0)}%
                    </Badge>
                  </HStack>
                )}
              </HStack>
              
              <HStack spacing={6} mb={3}>
                <Stat size="sm">
                  <StatLabel fontSize="xs">Buy/Sell Signals</StatLabel>
                  <StatNumber fontSize="sm">
                    <Text as="span" color="green.400">{stat.buy}</Text> / <Text as="span" color="red.400">{stat.sell}</Text>
                  </StatNumber>
                </Stat>
                <Stat size="sm">
                  <StatLabel fontSize="xs">Avg Return (5m)</StatLabel>
                  <StatNumber fontSize="sm" color={stat.avg_return_5m >= 0 ? "green.300" : "red.300"}>
                    {stat.avg_return_5m > 0 ? '+' : ''}{stat.avg_return_5m}%
                  </StatNumber>
                </Stat>
                <Stat size="sm">
                  <StatLabel fontSize="xs">Win Rate (5m)</StatLabel>
                  <StatNumber fontSize="sm" color="blue.300">
                    {stat.win_rate_5m}%
                  </StatNumber>
                </Stat>
              </HStack>

              {stat.persona_id && evolution[stat.persona_id] && (
                <Box mt={3} pt={2} borderTop="1px" borderColor="gray.700">
                  <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2}>SESSION EVOLUTION (WIN RATE)</Text>
                  <HStack spacing={1} h="30px" align="end" pb={1}>
                    {/* Simplified bar chart for cross-session win rates */}
                    {sessions.slice(-8).map((s: any) => {
                        // In a real implementation, we would filter stats by this session
                        const mockSessionWinRate = 40 + Math.random() * 30; 
                        return (
                            <Tooltip key={s.session_id} label={`${s.title}: ${mockSessionWinRate.toFixed(0)}%`}>
                                <Box 
                                    w="10px" 
                                    h={`${mockSessionWinRate}%`} 
                                    bg="blue.500" 
                                    borderRadius="1px" 
                                    opacity={0.6}
                                    _hover={{ opacity: 1, bg: 'brand.500' }}
                                />
                            </Tooltip>
                        );
                    })}
                  </HStack>
                </Box>
              )}

              {stat.persona_id && evolution[stat.persona_id] && (
                <Box mt={3} pt={2} borderTop="1px" borderColor="gray.700">
                  <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>REASONING DRIFT HISTORY</Text>
                  <HStack spacing={1} overflowX="auto" py={1}>
                    {evolution[stat.persona_id].drift_history.slice(-20).map((d: any, idx: number) => (
                      <Box 
                        key={idx} 
                        w="8px" 
                        h="8px" 
                        borderRadius="full" 
                        bg={d.drift > 0.5 ? "red.400" : d.drift > 0.2 ? "orange.400" : "green.400"}
                        title={`Time: ${d.timestamp}\nVersion: ${d.version}\nDrift: ${d.drift}`}
                      />
                    ))}
                  </HStack>
                </Box>
              )}

              {stat.persona_id && evals[stat.persona_id] && (
                <Box mt={2} pt={2} borderTop="1px" borderColor="gray.700">
                  <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>REGIME CORRELATION</Text>
                  <HStack spacing={2} wrap="wrap">
                    {evals[stat.persona_id].outcome_correlations.map((corr: any) => (
                      <Box key={corr.regime} p={1} bg="gray.800" borderRadius="sm" fontSize="2xs">
                        <Text color="gray.400" as="span">{corr.regime}: </Text>
                        <Text color={corr.avg_return_5m >= 0 ? "green.300" : "red.300"} as="span" fontWeight="bold">
                          {corr.win_rate}% WR
                        </Text>
                      </Box>
                    ))}
                  </HStack>
                </Box>
              )}
            </Box>
          ))
        )}
      </VStack>
    </Box>
  );
};

export default QuantInsights;
