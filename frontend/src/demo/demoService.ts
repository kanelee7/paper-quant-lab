import { 
  demoSignals, 
  demoSessions, 
  demoReflections, 
  demoPatterns, 
  demoGovernance, 
  demoStrategyStats, 
  demoPersonaEvolution,
  demoPersonaEvaluationData as demoPersonaEvaluation,
  demoWorkflowPresets,

  demoWalkthroughPresets,
  demoPersonas,
  demoComments,
  demoReplaySnapshots,
  demoArchives,
  demoPerformance,
  demoTaxonomy
} from './demoData';

const DEMO_MODE_KEY = 'pql_demo_mode_active';

export const isDemoModeActive = (): boolean => {
  return localStorage.getItem(DEMO_MODE_KEY) === 'true';
};

export const setDemoMode = (active: boolean) => {
  localStorage.setItem(DEMO_MODE_KEY, active ? 'true' : 'false');
  window.dispatchEvent(new Event('demo-mode-changed'));
};

export const getDemoData = (type: string) => {
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

  // Workflows & Walkthroughs
  if (url.includes('/api/workflows/presets')) {
    return { ok: true, json: async () => demoWorkflowPresets };
  }
  if (url.includes('/api/walkthroughs/presets')) {
    return { ok: true, json: async () => demoWalkthroughPresets };
  }

  // Personas
  if (url.includes('/api/personas/evaluation/')) {
    const pid = url.split('/').pop() || 'conservative_analyst';
    return { ok: true, json: async () => (demoPersonaEvaluation as any)[pid] || demoPersonaEvaluation.conservative_analyst };
  }
  if (url.includes('/api/personas/evolution/')) {
    const pid = url.split('/').pop() || 'conservative_analyst';
    return { ok: true, json: async () => (demoPersonaEvolution as any)[pid] || demoPersonaEvolution.conservative_analyst };
  }
  if (url.includes('/api/personas')) {
    return { ok: true, json: async () => demoPersonas };
  }

  // Comments
  if (url.includes('/api/comments')) {
    return { ok: true, json: async () => demoComments };
  }

  // Insights & Knowledge Base
  if (url.includes('/api/insights')) {
    return { ok: true, json: async () => demoSignals.map(s => ({ insight_id: s.id, title: s.strategy_name, summary: s.reason, confidence: 'High' })) };
  }
  if (url.includes('/api/taxonomy/failures')) {
    return { ok: true, json: async () => demoTaxonomy };
  }

  // Reviews
  if (url.includes('/api/reviews/contradictions')) {
    return { ok: true, json: async () => [
      { id: 'con-1', type: 'Contradiction', severity: 'Warning', description: 'Peer interpretation "Volatility Trap" contradicts local finding "Breakout Confirmation".' }
    ] };
  }
  if (url.includes('/api/reviews')) {
    return { ok: true, json: async () => [
      { review_id: 'rev-1', title: 'Q2 Volatility Synthesis', summary: 'Analytical review of persona adaptation during high-noise events.', created_at: new Date().toISOString(), review_scope: 'Quarterly', linked_sessions: ['demo-session-volatility'], linked_insights: ['insight-1'] }
    ] };
  }

  // Patterns
  if (url.includes('/api/patterns')) {
    return { ok: true, json: async () => demoPatterns };
  }

  // Replays & Snapshots
  if (url.includes('/api/replays/snapshots')) {
    return { ok: true, json: async () => demoReplaySnapshots };
  }

  // Archives
  if (url.includes('/api/archives')) {
    return { ok: true, json: async () => demoArchives };
  }

  // Performance
  if (url.includes('/api/performance')) {
    return { ok: true, json: async () => demoPerformance };
  }

  // Journals & Signals
  if (url.includes('/api/journal')) {
    return { ok: true, json: async () => demoSignals };
  }

  // Strategy Stats
  if (url.includes('/api/strategy/stats')) {
    return { ok: true, json: async () => demoStrategyStats };
  }

  // Sessions
  if (url.includes('/api/sessions')) {
    // If it's a detail request for a demo session summary
    if (url.includes('/summary')) {
      return { ok: true, json: async () => ({
        summary: "High-fidelity demo session summary.",
        top_patterns: ["Trend Following", "Mean Reversion"],
        frequent_failures: ["Volatility Blindness"],
        strongest_regime: "Trending",
        signal_count: 42,
        generated_at: new Date().toISOString()
      })};
    }
    return { ok: true, json: async () => demoSessions };
  }

  // Reliability & Governance
  if (url.includes('/api/reliability/reproducibility')) {
    return { ok: true, json: async () => demoGovernance };
  }

  // Market Data (OHLCV, OrderBook)
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

