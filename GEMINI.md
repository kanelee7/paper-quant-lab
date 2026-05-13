# Agent Operational Guide: PaperQuantLab

This file contains concise implementation rules for **PaperQuantLab**, a multi-asset research workstation. For long-term vision, philosophy, and architectural depth, refer to the `/docs` directory.

## Core Directives
1. **Simulation-First**: Never implement live brokerage execution. Hard-block order creation in all data providers.
2. **No Autonomous Trading**: Always assume the workstation is used for research and human-in-the-loop analysis.
3. **Prioritize Explainability**: Every strategy decision must produce a detailed `Signal` object with a clear `reason` and `indicators_snapshot`.
4. **Preserve Asset-Agnosticism**: Use `MarketProvider` and `AssetType`. Avoid crypto-specific logic in the core `trader` or `main` entry points.
5. **Iterative Changes**: Prefer small, reviewable, and surgical updates.
6. **Local-First**: Do not introduce cloud dependencies or external distributed systems.
7. **Replayability**: Ensure all decisions can be replayed or focused on the chart using the `focus-chart` event pattern.

## References
- **Project Identity**: See `/docs/VISION.md`
- **Mindset & Anti-Goals**: See `/docs/PHILOSOPHY.md`
- **Architectural Depth**: See `/docs/ARCHITECTURE.md`
- **Future Goals**: See `/docs/ROADMAP.md`
