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
8. **Persona Validation**: Prioritize reasoning quality and consistency over quantity of personas. Every persona signal must be evaluatable for its logical coherence.
9. **Reasoning Drift & Evolution**: Monitor how persona reasoning evolves over time and across versions. Use `drift_score` to detect behavioral shifts and similarity analysis to identify recurring patterns or biases.
10. **Research Session Management**: Organize work into bounded `ResearchSession` objects. Group signals, outcomes, and reasoning by experiment to support comparative longitudinal analysis.
11. **Knowledge Synthesis**: Accumulate findings into `ResearchInsight` objects. Synthesize raw experimental data into long-term research knowledge, linked to supporting evidence.
12. **Dataset Integrity & Reliability**: Prioritize dataset durability and reproducibility. Use the `ReliabilityManager` to validate data integrity, manage local timestamped backups, and ensure graceful recovery from file corruption or missing data.
13. **Workflow Ergonomics & Workspace Modes**: Optimize operational clarity by using specialized Workspace Modes (Research, Review, Training). Group tools logically (Experimentation, Knowledge, Maintenance) to reduce cognitive overload while preserving full evidence provenance.
14. **Training & Learning Foundations**: Support observational learning through Training Mode. Provide guided reasoning explanations, market regime hints, and persona comparison tooltips to help researchers and learners understand AI analytical patterns without autonomous authority.
15. **Workflow Presets & Guided Review**: Facilitate repeatable analytical studies using Research Workflow Presets. Guide researchers through structured pipelines (e.g., Volatility Study, Post-Mortem Review) with step-by-step instructions and contextual guidance to ensure systematic evidence review and annotation.
16. **Workstation Productization & Visual Design**: Maintain a premium, high-density technical aesthetic. Follow the PaperQuantLab design system (Charcoal/Old-Gold) to ensure a cohesive and calm research environment. Prioritize information hierarchy and evidence visibility across all workstation components.
17. **Interactive Replay & Exploration**: Enable dynamic evidence exploration through interactive replay tools. Use the `ReplayTimeline` for temporal navigation, implement side-by-side comparison workspaces, and support `ReplaySnapshots` to preserve specific analytical moments for longitudinal review.
18. **Knowledge Experience & Guided Interpretation**: Transform accumulated research data into guided understanding. Use `GuidedWalkthroughs` to narrate analytical stories, implement progressive disclosure to manage workstation complexity, and provide critique reflection prompts to support deep human interpretation.
19. **Onboarding & Workstation Continuity**: Prioritize researcher orientation and sustained usability. Implement structured onboarding, learning paths, and session continuity systems (e.g., recent context memory) to support long-term analytical operating cycles.
20. **Collaborative Evidence Continuity**: Facilitate multi-researcher collaboration through shared research packages and evidence-linked commentary. Ensure all shared interpretations preserve provenance metadata and remain deterministic during replay across different workstations.

## Product Positioning
PaperQuantLab is a **local-first human-centered AI reasoning research workstation**. 
- It is a **reasoning observability platform** for studying AI analytical styles.
- It is a **replay-backed learning environment** for evidence-based market interpretation.
- It is a **structured experimentation engine** supporting repeatable research workflows.
- It is an **interactive analytical laboratory** for temporal market research.
- It is a **guided knowledge experience** for internalizing longitudinal research findings.
- It is a **cohesive analytical operating environment** for sustained research productivity.
- It is a **shared research environment** built on absolute evidence continuity and deterministic replay.
- It is **simulation-only** and does not support autonomous financial decision authority.

## Phase 21: Multi-Researcher Collaboration Foundations & Shared Analytical Context
- **Shared Research Packages**: Implement workflows for exporting and importing bounded research studies with replay-linked evidence.
- **Collaborative Commentary Layer**: Introduce evidence-linked discussion threads and interpretation notes attached to specific replay moments.
- **Comparative Review Workspaces**: Enable side-by-side comparison of differing researcher annotations, narratives, and conclusions.
- **Shared Pattern Libraries**: Allow for the exchange of research archetypes and failure taxonomies with full source attribution and provenance.
- **Governance for Shared Context**: Extend data validation to handle imported evidence, surfacing contradictions or provenance conflicts.
- **Subtle Presence & Metadata**: Introduce lightweight awareness of shared or external research contexts within the workstation UX.

## References
- **Project Identity**: See `/docs/VISION.md`
- **Mindset & Anti-Goals**: See `/docs/PHILOSOPHY.md`
- **Architectural Depth**: See `/docs/ARCHITECTURE.md`
- **Future Goals**: See `/docs/ROADMAP.md`
