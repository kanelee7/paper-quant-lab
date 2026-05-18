export const demoSignals = [
  {
    id: "demo-sig-1",
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    symbol: "BTC/USDT",
    action: "sell",
    price: 64250.50,
    strategy_name: "Mean Reversion",
    persona_id: "conservative_analyst",
    session_id: "demo-session-volatility",
    reason: "RSI overbought (78) combined with bearish divergence on 5m timeframe.",
    reasoning_trace: "Observing clear exhaustion in buying pressure. Volume is decreasing while price makes a marginal higher high. Conservative persona prioritizes capital preservation over chasing the final 1% of the move. Indicators show RSI(14) at 78, while MACD histogram is beginning to contract.",
    market_regime: "volatile",
    outcomes: {
      "5m": { pct: -0.45, price_delta: -289.12 },
      "15m": { pct: -1.20, price_delta: -771.00 },
      "1h": { pct: -2.10, price_delta: -1349.26 }
    },
    indicators_snapshot: { rsi: 78, macd: "bearish_div", volume_delta: -15 },
    notes: "Classic exhaustion pattern successfully identified.",
    tags: ["exhaustion", "divergence"]
  },
  {
    id: "demo-sig-2",
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    symbol: "BTC/USDT",
    action: "buy",
    price: 63800.00,
    strategy_name: "Trend Following",
    persona_id: "momentum_trader",
    session_id: "demo-session-volatility",
    reason: "Support bounce at VWAP with high-volume confirmation.",
    reasoning_trace: "Momentum bias triggered by price reclamation of VWAP. Aggressive stance taken as institutional buying activity detected in order book. Liquidity clusters at lower levels have been cleared, path of least resistance is upward.",
    market_regime: "trending",
    outcomes: {
      "5m": { pct: 0.15, price_delta: 95.70 },
      "15m": { pct: -0.30, price_delta: -191.40 },
      "1h": { pct: 0.45, price_delta: 287.10 }
    },
    indicators_snapshot: { vwap: "above", adx: 32, spread: 2.5 },
    notes: "Minor drawdown before trend resumption. Persona showed slight overconfidence.",
    tags: ["vwap_reclaim", "momentum"]
  },
  {
    id: "demo-sig-3",
    timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    symbol: "ETH/USDT",
    action: "hold",
    price: 3450.25,
    strategy_name: "Regime Filter",
    persona_id: "risk_manager",
    session_id: "demo-session-sideways",
    reason: "High kurtosis detected in return distribution; avoiding entry.",
    reasoning_trace: "Market is exhibiting 'fat tail' characteristics. Typical mean reversion models will fail here. Risk Manager persona mandates standing aside until volatility stabilizes within the 2-sigma band. High uncertainty in directional bias.",
    market_regime: "sideways",
    indicators_snapshot: { kurtosis: 4.2, atr: 85, vol_std: 2.1 },
    notes: "Avoided a whipsaw move that liquidated momentum followers.",
    tags: ["risk_avoidance", "kurtosis_filter"]
  }
];

export const demoSessions = [
  {
    session_id: "demo-session-volatility",
    title: "Volatility Adaptation Study (May 2026)",
    description: "Analyzing how different AI personas adapt to rapid regime shifts from trending to volatile. Focus on signal quality decay during high-noise periods.",
    status: "completed",
    start_time: new Date(Date.now() - 86400000).toISOString(),
    end_time: new Date().toISOString(),
    signal_count: 42,
    metrics: {
      avg_confidence: 0.82,
      drift_score: 0.12,
      success_rate: 0.64
    }
  },
  {
    session_id: "demo-session-sideways",
    title: "Contrarian Drift in Low-Liquidity Markets",
    description: "Investigating the tendency of the Contrarian Trader persona to prematurely predict reversals during low-volume accumulation phases.",
    status: "active",
    start_time: new Date(Date.now() - 43200000).toISOString(),
    signal_count: 15,
    metrics: {
      avg_confidence: 0.65,
      drift_score: 0.28,
      success_rate: 0.45
    }
  }
];

export const demoReflections = [
  {
    id: "demo-ref-1",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    title: "Identifying Momentum Exhaustion",
    content: "Through repeated observation of the Conservative Analyst, I've noted that it consistently outperforms in identifying the 'last breath' of a move. The key indicator was not just the RSI level, but the decreasing order book depth on the bid side while price made new local highs.",
    type: "Learning",
    linked_session_id: "demo-session-volatility"
  },
  {
    id: "demo-ref-2",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    title: "Hypothesis: Whipsaw Protection",
    content: "The Risk Manager's stand-aside logic seems to correlate with ATR spikes that precede major whipsaws. Hypothesis: integrating ATR-normalized volatility bands into the Momentum Trader could reduce its drawdown by 15%.",
    type: "Hypothesis",
    linked_session_id: "demo-session-volatility"
  }
];

export const demoPatterns = [
  {
    id: "pattern-vol-blindness",
    label: "Volatility Blindness",
    description: "Failure to adjust position sizing or entry logic during rapid ATR expansion.",
    examples: 12,
    severity: "high"
  },
  {
    id: "pattern-trend-chase",
    label: "Trend Chasing Spiral",
    description: "Repeated entries at local tops due to momentum-bias over-weighting in the reasoning engine.",
    examples: 8,
    severity: "medium"
  }
];

export const demoGovernance = {
  status: "degraded",
  schema_version: "2.4.1",
  replay_version: "v2",
  broken_links: [
    {
      id: "c1",
      type: "Contradiction",
      severity: "Warning",
      description: "Peer interpretation 'Volatility Trap' contradicts local finding 'Breakout Confirmation' for Signal sig_88a2.",
      evidence_ids: ["sig_88a2"]
    },
    {
      id: "c2",
      type: "Provenance",
      severity: "Critical",
      description: "Imported research 'Momentum Alpha' references replay states missing in local data provider.",
      evidence_ids: ["replay_v1_0514"]
    }
  ],
  recommendations: [
    "Resync replay data for session 'Volatility Study'",
    "Validate persona reasoning drift in 'Momentum Trader'"
  ]
};

export const demoInsights = [
  {
    id: "insight-1",
    title: "Volatility Drift Correlation",
    description: "Identified a strong correlation between increasing ATR and reasoning drift in the Momentum Trader persona. Confidence scores remain high (0.85+) despite a 40% drop in prediction accuracy.",
    type: "Observation",
    evidence_count: 12
  },
  {
    id: "insight-2",
    title: "Recursive Reasoning Loop",
    description: "Detected a failure pattern where the Conservative Analyst justifies holding losing positions by referencing 'long-term support' that was already invalidated.",
    type: "Failure",
    evidence_count: 5
  }
];

export const demoTaxonomy = [
  { id: "exhaustion", label: "Exhaustion Failure", description: "Entering at the absolute peak of a parabolic move." },
  { id: "bias", label: "Confirmation Bias", description: "Ignoring contradictory indicators to justify a pre-planned entry." },
  { id: "vol", label: "Volatility Blindness", description: "Trading high-leverage strategies during news-driven spikes." }
];

export const demoWorkflowPresets = [
  {
    preset_id: "vol-study",
    title: "High Volatility Regime Study",
    description: "Systematic review of persona adaptation during 2%+ ATR expansion events.",
    recommended_mode: "RESEARCH",
    workflow_steps: [
      { id: "s1", label: "Initialize Feed", guidance: "Select a volatile asset and establish L2 connectivity." },
      { id: "s2", label: "Monitor Divergence", guidance: "Observe RSI/Price divergence markers on the chart." },
      { id: "s3", label: "Annotate Signals", guidance: "Bookmark signals that exhibit reasoning drift." }
    ]
  },
  {
    preset_id: "post-mortem",
    title: "Post-Mortem Failure Analysis",
    description: "Deep-dive into local invalidated hypotheses and reasoning loops.",
    recommended_mode: "REVIEW",
    workflow_steps: [
      { id: "p1", label: "Load Archive", guidance: "Import a historical research package." },
      { id: "p2", label: "Conflict Scan", guidance: "Run governance check for peer contradictions." }
    ]
  }
];

export const demoWalkthroughPresets = [
  {
    id: "intro-obs",
    title: "The Art of Reasoning Observability",
    description: "Learning to distinguish between technical signals and logical traces.",
    steps: [
      { target: "chart", content: "Focus on the orange markers; these represent AI analytical thoughts, not just price points." },
      { target: "journal", content: "Review how the Risk Manager overrides momentum when volatility is non-Gaussian." }
    ]
  }
];

export const demoPersonas = [
  { id: "conservative_analyst", name: "Conservative Analyst", profile: "Capital preservation focused. High threshold for entry." },
  { id: "momentum_trader", name: "Momentum Trader", profile: "Aggressive trend chaser. Optimized for high-velocity moves." },
  { id: "risk_manager", name: "Risk Manager", profile: "Constraint-driven. Operates only within strict volatility bands." }
];

export const demoComments = [
  { id: "com-1", timestamp: new Date().toISOString(), author: "Senior Researcher", content: "Signal sig-1 shows classic overconfidence. Note the absence of RSI confirmation in the reasoning trace.", signal_id: "demo-sig-1" }
];

export const demoReplaySnapshots = [
  { id: "snap-vol-spike", title: "BTC Flash Crash (May 14)", timestamp: new Date().toISOString(), symbol: "BTC/USDT", note: "Preserved for volatility training." }
];

export const demoArchives = [
  { archive_id: "arch-2026-q1", title: "Q1 2026 Research Synthesis", created_at: new Date().toISOString(), session_count: 24, signal_count: 850 }
];

export const demoPerformance = {
  total_signals: 1240,
  win_rate: 62.4,
  sharpe_ratio: 2.1,
  max_drawdown: 12.5,
  daily_stats: Array.from({ length: 30 }).map((_, i) => ({
    date: new Date(Date.now() - (30 - i) * 86400000).toLocaleDateString(),
    pnl: (Math.random() - 0.4) * 100
  }))
};



export const demoStrategyStats = {
  "Mean Reversion": {
    total: 124,
    buy: 45,
    sell: 42,
    hold: 37,
    avg_return_5m: 0.12,
    win_rate_5m: 58.5,
    outcomes_count: 124,
    persona_id: "conservative_analyst"
  },
  "Trend Following": {
    total: 89,
    buy: 62,
    sell: 15,
    hold: 12,
    avg_return_5m: 0.35,
    win_rate_5m: 64.2,
    outcomes_count: 89,
    persona_id: "momentum_trader"
  }
};

export const demoPersonaEvolution = {
  conservative_analyst: {
    persona_id: "conservative_analyst",
    drift_history: Array.from({ length: 20 }).map((_, i) => ({
      timestamp: new Date(Date.now() - (20 - i) * 86400000).toISOString(),
      version: `v1.${i}`,
      drift: Math.random() * 0.3
    }))
  },
  momentum_trader: {
    persona_id: "momentum_trader",
    drift_history: Array.from({ length: 20 }).map((_, i) => ({
      timestamp: new Date(Date.now() - (20 - i) * 86400000).toISOString(),
      version: `v1.${i}`,
      drift: Math.random() * 0.6 // Higher drift for momentum
    }))
  }
};

export const demoPersonaEvaluation = {
  conservative_analyst: {
    consistency: { consistency_score: 0.92 },
    outcome_correlations: [
      { regime: 'trending', win_rate: 65, avg_return_5m: 0.2 },
      { regime: 'volatile', win_rate: 42, avg_return_5m: -0.1 },
      { regime: 'sideways', win_rate: 55, avg_return_5m: 0.05 }
    ]
  },
  momentum_trader: {
    consistency: { consistency_score: 0.78 },
    outcome_correlations: [
      { regime: 'trending', win_rate: 78, avg_return_5m: 0.8 },
      { regime: 'volatile', win_rate: 55, avg_return_5m: 0.3 },
      { regime: 'sideways', win_rate: 32, avg_return_5m: -0.4 }
    ]
  }
};

