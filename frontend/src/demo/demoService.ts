import { demoSignals, demoSessions, demoReflections, demoPatterns, demoGovernance, demoStrategyStats, demoPersonaEvolution, demoPersonaEvaluation } from './demoData';

const DEMO_MODE_KEY = 'pql_demo_mode_active';

export const isDemoModeActive = (): boolean => {
  return localStorage.getItem(DEMO_MODE_KEY) === 'true';
};

export const setDemoMode = (active: boolean) => {
  localStorage.setItem(DEMO_MODE_KEY, active ? 'true' : 'false');
  window.dispatchEvent(new Event('demo-mode-changed'));
};

export const getDemoData = (type: 'signals' | 'sessions' | 'reflections' | 'patterns' | 'governance') => {
  switch (type) {
    case 'signals': return demoSignals;
    case 'sessions': return demoSessions;
    case 'reflections': return demoReflections;
    case 'patterns': return demoPatterns;
    case 'governance': return demoGovernance;
    default: return null;
  }
};

/**
 * Interceptor helper for fetch calls
 * If demo mode is active and the URL matches a known analytical endpoint,
 * return demo data instead of hitting the backend.
 */
export const demoInterceptor = async (url: string, options?: any) => {
  if (!isDemoModeActive()) return null;

  if (url.includes('/api/journal')) {
    return { ok: true, json: async () => demoSignals };
  }
  if (url.includes('/api/sessions')) {
    return { ok: true, json: async () => demoSessions };
  }
  if (url.includes('/api/reliability/reproducibility')) {
    return { ok: true, json: async () => demoGovernance };
  }
  if (url.includes('/api/strategy/stats')) {
    return { ok: true, json: async () => demoStrategyStats };
  }
  if (url.includes('/api/personas/evaluation/')) {
    const pid = url.split('/').pop() || 'conservative_analyst';
    return { ok: true, json: async () => (demoPersonaEvaluation as any)[pid] || demoPersonaEvaluation.conservative_analyst };
  }
  if (url.includes('/api/personas/evolution/')) {
    const pid = url.split('/').pop() || 'conservative_analyst';
    return { ok: true, json: async () => (demoPersonaEvolution as any)[pid] || demoPersonaEvolution.conservative_analyst };
  }
  if (url.includes('/orderbook')) {
    return { ok: true, json: async () => ({
      status: 'success',
      data: {
        bids: [[64100, 0.5], [64090, 1.2], [64080, 2.5], [64070, 4.1], [64060, 0.8]],
        asks: [[64120, 0.3], [64130, 0.9], [64140, 3.1], [64150, 2.2], [64160, 1.5]]
      }
    })};
  }
  if (url.includes('/ohlcv')) {
    // Generate a simple trend for the chart
    const now = Math.floor(Date.now() / 1000);
    const data = Array.from({ length: 150 }).map((_, i) => ({
      timestamp: (now - (150 - i) * 60) * 1000,
      open: 64000 + i * 5 + Math.random() * 20,
      high: 64000 + i * 5 + 30 + Math.random() * 20,
      low: 64000 + i * 5 - 10 - Math.random() * 20,
      close: 64000 + i * 5 + 10 + Math.random() * 20,
      volume: 10 + Math.random() * 50
    }));
    return { ok: true, json: async () => data };
  }
  
  return null;
};

