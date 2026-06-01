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
    notes: "Classic exhaustion pattern successfully identified. Verification needed on L2 liquidity depth at the moment of entry.",
    tags: ["exhaustion", "divergence", "needs_verification"],
    verified: false,
    evaluation: { quality_score: 0.88, flags: [] },
    last_audit: new Date(Date.now() - 86400000).toISOString()
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
    notes: "Minor drawdown before trend resumption. Persona showed slight overconfidence. Audit suggested adjusting momentum weights.",
    tags: ["vwap_reclaim", "momentum", "audited"],
    verified: true,
    evaluation: { quality_score: 0.72, flags: ["overconfidence"] },
    last_audit: new Date(Date.now() - 172800000).toISOString()
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
    notes: "Avoided a whipsaw move that liquidated momentum followers. Reflection: risk-off was the correct stance despite peer pressure.",
    tags: ["risk_avoidance", "kurtosis_filter", "verified"],
    verified: true,
    evaluation: { quality_score: 0.95, flags: [] },
    last_audit: new Date(Date.now() - 259200000).toISOString()
  },
  {
    id: "demo-sig-4",
    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    symbol: "SOL/USDT",
    action: "buy",
    price: 145.20,
    strategy_name: "Breakout",
    persona_id: "momentum_trader",
    session_id: "demo-session-old",
    reason: "Resistance breach with volume spike.",
    reasoning_trace: "Incomplete trace due to local buffer overflow. Signal recorded but logic needs reconstruction from replay.",
    market_regime: "trending",
    outcomes: {
      "5m": { pct: 0.85, price_delta: 1.23 },
      "15m": { pct: 1.45, price_delta: 2.10 },
      "1h": { pct: -0.15, price_delta: -0.22 }
    },
    indicators_snapshot: null,
    notes: "Stale annotation: breakout was valid but exit logic was delayed. Need to re-examine the lag in v1.2 execution.",
    tags: ["stale", "metadata_missing", "unresolved"],
    verified: false,
    evaluation: { quality_score: 0.35, flags: ["data_loss", "logic_gap"] }
  },
  {
    id: "demo-sig-5",
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30m ago
    symbol: "ETH/USDT",
    action: "buy",
    price: 3510.50,
    strategy_name: "Trend Following",
    persona_id: "momentum_trader",
    session_id: "demo-session-volatility",
    reason: "Strong upward momentum after breaking 3500 level.",
    reasoning_trace: "Chasing the breakout. Path looks clear with minimal resistance above. Over-weighting recent 1m green candles while ignoring the 1h bearish divergence. This is a high-risk entry but fits the current aggressive bias of the persona.",
    market_regime: "volatile",
    outcomes: {
      "5m": { pct: -0.12, price_delta: -4.21 },
      "15m": { pct: -0.85, price_delta: -29.84 },
      "1h": { pct: -1.50, price_delta: -52.65 }
    },
    indicators_snapshot: { rsi: 72, volume_spike: true },
    notes: "Classic 'top-chasing' behavior. Reasoning failed to account for higher-timeframe exhaustion. Useful as a negative example for training.",
    tags: ["fom_entry", "failure", "low_quality"],
    verified: true,
    evaluation: { quality_score: 0.42, flags: ["momentum_bias", "timeframe_conflict"] },
    review_note: "Persona failed to recognize the local top. Recommendation: increase weight of multi-timeframe confirmation."
  },
  {
    id: "demo-sig-6",
    timestamp: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
    symbol: "BTC/USDT",
    action: "hold",
    price: 63500.00,
    strategy_name: "Mean Reversion",
    persona_id: "conservative_analyst",
    session_id: "demo-session-sideways",
    reason: "Ambiguous signals at range mid-point.",
    reasoning_trace: "Indicators are conflicting. 15m RSI is neutral (52), but L2 book shows heavy sell-side pressure just above. Conservative stance is to wait for clear rejection or breakout from the current 63k-64k range. Risk of chop is too high for a meaningful entry.",
    market_regime: "sideways",
    indicators_snapshot: { rsi: 52, order_book_imbalance: -12 },
    notes: "Correct avoidance of a choppy period. However, missed a 0.5% scalp opportunity that Momentum Trader took. Trade-off between safety and activity.",
    tags: ["neutral_bias", "range_bound"],
    verified: true,
    evaluation: { quality_score: 0.91, flags: [] }
  },
  {
    id: "demo-sig-7",
    timestamp: new Date(Date.now() - 25300000).toISOString(), // ~7 hours ago, irregular
    symbol: "SOL/USDT",
    action: "sell",
    price: 142.30,
    strategy_name: "Breakout",
    persona_id: "contrarian_trader",
    session_id: "demo-session-stale",
    reason: "Local top divergence.",
    reasoning_trace: "[WARN: TRACE FRAGMENTED] ...sell-side liquidity increasing. Momentum slowing down. Expecting a reversion to the 138 level within the next 2 hours. Confidence degrading due to missing API heartbeat.",
    market_regime: "unknown",
    outcomes: {
      "5m": { pct: -0.1, price_delta: -0.15 },
    },
    indicators_snapshot: { missing_data: true, api_lag: "400ms" },
    notes: "Data feed interrupted during evaluation. Signal abandoned.",
    tags: ["interrupted", "degraded_confidence", "unresolved"],
    verified: false,
    evaluation: { quality_score: 0.22, flags: ["fragmented", "stale_data"] },
    review_note: "Review pending. Looks like an API timeout caused this logic failure."
  },
  {
    id: "demo-sig-8",
    timestamp: new Date(Date.now() - 32540000).toISOString(), // ~9 hours ago
    symbol: "ETH/USDT",
    action: "buy",
    price: 3390.15,
    strategy_name: "Regime Filter",
    persona_id: "momentum_trader",
    session_id: "demo-session-volatility",
    reason: "Spike in buying pressure.",
    reasoning_trace: "Rapid accumulation detected. Entering aggressively.",
    market_regime: "volatile",
    outcomes: {
      "5m": { pct: 0.4, price_delta: 13.5 },
      "15m": { pct: 0.9, price_delta: 30.5 },
      "1h": { pct: -0.5, price_delta: -16.9 }
    },
    indicators_snapshot: { volume_profile: "heavy_bid" },
    notes: "Quick scalp. Trace is unusually brief. Needs further inspection to ensure it wasn't just chasing a phantom order.",
    tags: ["brief_trace", "needs_review"],
    verified: false,
    evaluation: { quality_score: 0.58, flags: ["superficial_logic"] },
    review_note: "Awaiting replay validation. Trace is too thin to justify the risk."
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
      avg_confidence: 0.724,
      drift_score: 0.154,
      success_rate: 0.521
    },
    last_reviewed: new Date(Date.now() - 3600000).toISOString()
  },
  {
    session_id: "demo-session-sideways",
    title: "Contrarian Drift in Low-Liquidity Markets",
    description: "Investigating the tendency of the Contrarian Trader persona to prematurely predict reversals during low-volume accumulation phases.",
    status: "active",
    start_time: new Date(Date.now() - 43200000).toISOString(),
    signal_count: 15,
    metrics: {
      avg_confidence: 0.612,
      drift_score: 0.312,
      success_rate: 0.428
    },
    last_reviewed: new Date(Date.now() - 7200000).toISOString(),
    tags: []
  },
  {
    session_id: "demo-session-old",
    title: "Archived: Alpha Decay Investigation (April)",
    description: "Investigation into why the Breakout strategy exhibited significant alpha decay after the April patch. Partially completed before team pivot.",
    status: "completed",
    start_time: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
    end_time: new Date(Date.now() - 2505600000).toISOString(),
    signal_count: 128,
    metrics: {
      avg_confidence: 0.48,
      drift_score: 0.52,
      success_rate: 0.35
    },
    last_reviewed: new Date(Date.now() - 1296000000).toISOString(), // 15 days ago
    tags: []
  },
  {
    session_id: "demo-session-stale",
    title: "Unresolved: Market Regime Drift Test",
    description: "A stale session intended to test automatic regime switching. Data ingestion was interrupted, leaving several signals without outcome confirmation.",
    status: "interrupted",
    start_time: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
    end_time: new Date(Date.now() - 518400000).toISOString(),
    signal_count: 8,
    metrics: {
      avg_confidence: 0.55,
      drift_score: 0.65,
      success_rate: 0.0
    },
    last_reviewed: new Date(Date.now() - 518400000).toISOString(),
    tags: ["stale", "interrupted", "incomplete_data"]
  }
];

export const demoReflections = [
  {
    id: "demo-ref-1",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    title: "Identifying Momentum Exhaustion",
    content: "Through repeated observation of the Conservative Analyst, I've noted that it consistently outperforms in identifying the 'last breath' of a move. The key indicator was not just the RSI level, but the decreasing order book depth on the bid side while price made new local highs.",
    type: "Learning",
    linked_session_id: "demo-session-volatility",
    author: "Researcher_A"
  },
  {
    id: "demo-ref-2",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    title: "Hypothesis: Whipsaw Protection",
    content: "The Risk Manager's stand-aside logic seems to correlate with ATR spikes that precede major whipsaws. Hypothesis: integrating ATR-normalized volatility bands into the Momentum Trader could reduce its drawdown by 15%. (Awaiting verification from session data).",
    type: "Hypothesis",
    linked_session_id: "demo-session-volatility",
    author: "Researcher_B"
  },
  {
    id: "demo-ref-3",
    timestamp: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
    title: "Abandoned: Regime Switching Lag",
    content: "Attempted to quantify the lag between regime detection and persona adaptation. Findings were inconclusive due to high noise in the 1m timeframe. Archiving for now due to data quality issues.",
    type: "Abandoned",
    linked_session_id: "demo-session-old",
    author: "Researcher_A"
  },
  {
    id: "demo-ref-4",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    title: "Critical Critique: Over-reliance on VWAP",
    content: "Both Momentum Trader and Contrarian are over-weighting VWAP as an absolute pivot. In low-volume regimes, VWAP loses its significance and leads to 'mid-range chop' entries. Need a volume-weighted reliability score for all pivots.",
    type: "Critique",
    linked_session_id: "demo-session-sideways",
    author: "Senior_Researcher"
  },
  {
    id: "demo-ref-5",
    timestamp: new Date(Date.now() - 12400000).toISOString(),
    title: "Pending Review: Order Book Imbalance",
    content: "[Fragment] ...initial check showed momentum diverging from book depth. Need to pull L2 snapshot for sig-7. Waiting for data sync.",
    type: "Observation",
    linked_session_id: "demo-session-stale",
    author: "Junior_Analyst"
  }
];

export const demoPatterns = [
  {
    pattern_id: "pattern-vol-blindness",
    title: "Volatility Blindness",
    description: "Failure to adjust position sizing or entry logic during rapid ATR expansion.",
    linked_failure_types: ["vol", "risk_avoidance"],
    linked_replay_ids: ["demo-sig-1", "demo-sig-5"],
    linked_personas: ["momentum_trader"],
    linked_insight_ids: ["insight-1"],
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    pattern_id: "pattern-trend-chase",
    title: "Trend Chasing Spiral",
    description: "Repeated entries at local tops due to momentum-bias over-weighting in the reasoning engine.",
    linked_failure_types: ["bias", "exhaustion"],
    linked_replay_ids: ["demo-sig-2", "demo-sig-5"],
    linked_personas: ["momentum_trader", "conservative_analyst"],
    linked_insight_ids: ["insight-3"],
    created_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    pattern_id: "pattern-stale-reasoning",
    title: "Stale Logic Persistence",
    description: "Persona continues to reference invalidated support/resistance levels from >4h ago.",
    linked_failure_types: ["stale"],
    linked_replay_ids: ["demo-sig-4", "demo-sig-7"],
    linked_personas: ["momentum_trader", "contrarian_trader"],
    linked_insight_ids: ["insight-2"],
    created_at: new Date(Date.now() - 604800000).toISOString()
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
      evidence_ids: ["sig_88a2"],
      age_hours: 11,
      status: "unresolved"
    },
    {
      id: "c2",
      type: "Provenance",
      severity: "Critical",
      description: "Imported research 'Momentum Alpha' references replay states missing in local data provider.",
      evidence_ids: ["replay_v1_0514"],
      age_hours: 48,
      status: "unresolved"
    },
    {
      id: "c3",
      type: "Disagreement",
      severity: "Info",
      description: "Senior Researcher disagreed with Junior_Analyst's manual annotation on sig-1. Reasoning: 'RSI divergence was not confirmed by volume profile.'",
      evidence_ids: ["demo-sig-1"],
      age_hours: 2,
      status: "awaiting_review"
    }
  ],
  recommendations: [
    "Resync replay data for session 'Volatility Study'",
    "Validate persona reasoning drift in 'Momentum Trader'",
    "Resolve contradiction c1 before finalizing Q2 synthesis",
    "Review unresolved signals in stale session 'Market Regime Drift Test'"
  ]
};

export const demoInsights = [
  {
    id: "insight-1",
    title: "Volatility Drift Correlation",
    description: "Identified a strong correlation between increasing ATR and reasoning drift in the Momentum Trader persona. Confidence scores remain high (0.85+) despite a 40% drop in prediction accuracy.",
    type: "Observation",
    evidence_count: 12,
    status: "verified"
  },
  {
    id: "insight-2",
    title: "Recursive Reasoning Loop",
    description: "Detected a failure pattern where the Conservative Analyst justifies holding losing positions by referencing 'long-term support' that was already invalidated.",
    type: "Failure",
    evidence_count: 5,
    status: "needs_verification"
  },
  {
    id: "insight-3",
    title: "Alpha Decay in V1.2",
    description: "Breakout strategy shows 22% lower success rate since v1.2 patch. Hypothesis: new liquidity filter is too aggressive, filtering out valid high-volume breakouts.",
    type: "Analysis",
    evidence_count: 45,
    status: "active"
  },
  {
    id: "insight-4",
    title: "Contradictory L2 Behavior",
    description: "Contrarian trader is misinterpreting spoofed walls as firm resistance. [Note: Needs further validation. Conflicting evidence in recent ETH session].",
    type: "Anomaly",
    evidence_count: 3,
    status: "degraded"
  }
];

export const demoTaxonomy = [
  { id: "exhaustion", label: "Exhaustion Failure", description: "Entering at the absolute peak of a parabolic move." },
  { id: "bias", label: "Confirmation Bias", description: "Ignoring contradictory indicators to justify a pre-planned entry." },
  { id: "vol", label: "Volatility Blindness", description: "Trading high-leverage strategies during news-driven spikes." },
  { id: "stale", label: "Stale Logic", description: "Referencing outdated market levels or regime definitions." }
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
  { id: "risk_manager", name: "Risk Manager", profile: "Constraint-driven. Operates only within strict volatility bands." },
  { id: "contrarian_trader", name: "Contrarian Trader", profile: "Reversion biased. Seeks early exhaustion markers." }
];

export const demoComments = [
  { id: "com-1", timestamp: new Date(Date.now() - 3600000).toISOString(), author: "Senior Researcher", content: "Signal sig-1 shows classic overconfidence. Note the absence of RSI confirmation in the reasoning trace.", signal_id: "demo-sig-1" },
  { id: "com-2", timestamp: new Date(Date.now() - 1800000).toISOString(), author: "Junior_Analyst", content: "Disagree. RSI divergence was evident on the 1m chart, which Conservative Analyst might be over-weighting.", signal_id: "demo-sig-1" },
  { id: "com-3", timestamp: new Date(Date.now() - 7200000).toISOString(), author: "Researcher_B", content: "VWAP bounce confirmed by L2 order flow. Path is clear.", signal_id: "demo-sig-2" }
];

export const demoReplaySnapshots = [
  { id: "snap-vol-spike", title: "BTC Flash Crash (May 14)", timestamp: new Date(Date.now() - 432000000).toISOString(), symbol: "BTC/USDT", note: "Preserved for volatility training. Observed massive reasoning drift in v1.2.", last_replayed: new Date(Date.now() - 172800000).toISOString() },
  { id: "snap-sideways-grind", title: "ETH Sideways Consolidation", timestamp: new Date(Date.now() - 864000000).toISOString(), symbol: "ETH/USDT", note: "Studying Risk Manager's avoidance of fake-outs.", last_replayed: new Date(Date.now() - 604800000).toISOString() }
];

export const demoArchives = [
  { archive_id: "arch-2026-q1", title: "Q1 2026 Research Synthesis", created_at: new Date(Date.now() - 2592000000).toISOString(), session_count: 24, signal_count: 850 },
  { archive_id: "arch-2026-beta", title: "Initial Persona Alpha Tests", created_at: new Date(Date.now() - 7776000000).toISOString(), session_count: 12, signal_count: 310 },
  { archive_id: "arch-stale-logic", title: "Legacy V1.1 Reasoning Traces", created_at: new Date(Date.now() - 15552000000).toISOString(), session_count: 5, signal_count: 120 }
];

export const demoPerformance = {
  total_signals: 1240,
  win_rate: 54.2,
  sharpe_ratio: 1.45,
  max_drawdown: 18.2,
  research_drift: 0.24,
  last_audit: new Date(Date.now() - 86400000).toISOString(),
  daily_stats: Array.from({ length: 30 }).map((_, i) => ({
    date: new Date(Date.now() - (30 - i) * 86400000).toLocaleDateString(),
    pnl: (Math.random() - 0.48) * 100
  }))
};



export const demoStrategyStats = {
  "Mean Reversion": {
    total: 124,
    buy: 45,
    sell: 42,
    hold: 37,
    avg_return_5m: 0.08,
    win_rate_5m: 52.5,
    outcomes_count: 124,
    persona_id: "conservative_analyst"
  },
  "Trend Following": {
    total: 89,
    buy: 62,
    sell: 15,
    hold: 12,
    avg_return_5m: 0.22,
    win_rate_5m: 58.2,
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

export const demoFindings = [
  {
    id: "finding-1",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    title: "VWAP Rejection Pattern in Volatile Regimes",
    observation: "Momentum Trader consistently fails when price approaches VWAP from below during high ATR periods. The 'Trend Following' logic misinterprets local noise as breakout confirmation, leading to immediate whipsaws.",
    related_signal_ids: ["demo-sig-2", "demo-sig-5"],
    confidence: 0.85,
    related_session_ids: ["demo-session-volatility"],
    status: "active",
    tags: ["VWAP", "failure-mode", "high-volatility"]
  },
  {
    id: "finding-2",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    title: "Risk Manager Alpha in Sideways Markets",
    observation: "The Risk Manager persona successfully filtered out 85% of non-profitable signals during the May 15th sideways grind. Its kurtosis-based entry filter is a primary alpha driver in low-liquidity states.",
    related_signal_ids: ["demo-sig-3", "demo-sig-6"],
    confidence: 0.92,
    related_session_ids: ["demo-session-sideways"],
    status: "active",
    tags: ["RiskManager", "alpha", "sideways"]
  },
  {
    id: "finding-3",
    timestamp: new Date(Date.now() - 604800000).toISOString(),
    title: "Stale Logic Decay (V1.2 Patch)",
    observation: "Observation confirmed: Breakout strategies exhibited 22% higher decay rate after the V1.2 liquidity filter update. The filter is too aggressive on large-cap pairs like BTC.",
    related_signal_ids: ["demo-sig-4", "demo-sig-7"],
    confidence: 0.78,
    related_session_ids: ["demo-session-old"],
    status: "contradicted",
    tags: ["alpha-decay", "patch-v1.2", "stale"]
  }
];

export const demoPersonaEvaluationData = {
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
