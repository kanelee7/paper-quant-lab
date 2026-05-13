# Project Roadmap

## Phase 1–2: Foundation (Completed)
- [x] Paper-Trading Simulator Engine (`SimulatedMarket`).
- [x] Structured Decision Journaling (Signal Objects).
- [x] Basic Frontend for real-time monitoring.
- [x] Multi-Asset abstraction refactoring.

## Phase 3: Research Workstation (Completed)
- [x] Signal outcome tracking and performance stats.
- [x] Replay-on-chart UX (Context jumping).
- [x] Manual tagging and post-mortem annotations.
- [x] Market Regime Detection (Trending/Volatile/Sideways).

## Phase 4: Outcome Intelligence (Current - Stabilized)
- [x] **Outcome Intelligence**: Automated comparison of "Signal at Time T" vs "Result at Time T+N" to identify strategy decay.
- [x] Performance statistics based on 5m/15m/1h/1d outcomes.
- [x] Visual indicators in Signal Journal for quick feedback.
- [x] Robust JSON journal persistence and schema validation.

## Phase 5: AI Reasoning Persona Sandbox (Next)
- [ ] **AI Reasoning Personas**: Implement conservative, contrarian, and momentum personas for signal debate.
- [ ] **Strategy Comparison**: Side-by-side simulation of multiple strategies on the same timeline.
- [ ] **Historical Replay**: Ingesting historical datasets for "Back-journaling."

---
See `docs/HANDOFF.md` for current workstation capabilities and constraints.

