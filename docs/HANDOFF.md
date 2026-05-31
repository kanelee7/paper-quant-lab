# PaperQuantLab: Project Handoff

## 1. Project State Summary
PaperQuantLab is a **local-first market reasoning workstation**. It is not a consumer app or a generic SaaS dashboard; it is a professional, high-density environment designed for human-in-the-loop observation and synthesis of AI trading logic. The core architecture revolves around a deterministic replay engine, qualitative evidence tracking, and longitudinal research continuity.

## 2. Landing Hero Status (FROZEN)
**CRITICAL: The landing page hero and `QuantMorphField` are considered FROZEN and STABLE.**
- **Do not redesign the hero again** unless there is a severe, verified usability bug.
- The `QuantMorphField` direction is finalized (based on the `eb1577a` semantic shape language).
- Continuity fixes (stable vertex mapping, drift prevention, eased transitions) are actively preserved.
- **AVOID:** Constraint-field/instrument metaphors, hard wireframe/cube redesigns, and generic CGI sphere/demo aesthetics. Endless redesign loops here are an anti-pattern.

## 3. Visual Identity Principles
The workstation must feel like a specialized, heavy-duty research instrument.
- **Preserve:** Restrained, operational, research-grade, terminal-like confidence. Dense but readable. Charcoal / old-gold palette. Atmospheric analytical topology.
- **Avoid:** AI startup glow, vibrant SaaS gradients, cyberpunk chaos, flashy/dramatic motion, and fake futuristic UI.

## 4. Completed Workstation Phases
- **Evidence-Centric Workstation:** Established the foundation for tracing AI logic to market indicators.
- **Interactive Replay & Inspection Flow:** Built the temporal scrubber allowing frame-by-frame inspection of analytical traces.
- **Demo Realism & Research Proof Layer:** Replaced perfect placeholder data with mixed-quality reasoning, failed traces, and realistic metrics.
- **Analytical Workflow Surface:** Integrated the `HypothesisManager` to track evolving research questions linked to replay checkpoints.
- **Operational Compression & Focus:** Stripped away academic/philosophical terminology (e.g., "Analytical Synthesis" -> "Research Notes") for a direct, "trading desk" tone.
- **Investigation Focus Mode:** Implemented a contextual UI state where inspecting a signal visually recedes unrelated panels to reduce cognitive load.
- **Workbench Realism & Data Density:** Injected operational messiness (interrupted sessions, contradictory L2 behavior, irregular timings) and dynamic chart annotations (`[?]`, `[WARN]`) to make the environment feel genuinely used.

## 5. Current UX Direction
The workstation experience must explicitly support the following iterative loop:
`Signal` → `Replay Inspection` → `Evidence Review` → `Hypothesis Refinement` → `Archive Continuity`

The focus is on inspectability, believable analytical residue (messiness/uncertainty), and longitudinal research over isolated dashboard metrics.

## 6. Important Constraints
- **Primary Surface:** Replay and evidence tracing must remain the focal point of the active workstation.
- **Tone:** Enforce operational, terminal-like wording. Avoid over-academic terminology or the "AI cognition lab" vibe.
- **Realism:** Avoid perfect win rates, flawless logic traces, or overly clean archive structures. Preserve ambiguity and failure.
- **Mobile:** The `QuantMorphField` topology must remain atmospheric and secondary on mobile (scaling/density refinements are currently active). Do not let it dominate content.

## 7. Current Priority
The immediate focus for subsequent sessions is entirely on **operational usability and workflow cohesion**.
- Refine replay readability.
- Strengthen archive continuity and investigation flow.
- Ensure the workstation feels robust and lived-in.
- **NOT A PRIORITY:** Landing page redesigns, shader experimentation, or introducing dramatic new visual systems.

## 8. Suggested Next Phases
- **Workflow Compression:** Further streamline the interaction path from replay observation to journal entry.
- **Replay Annotation Depth:** Enhance the ability to attach specific reviewer critiques directly to temporal checkpoints.
- **Archive Navigation:** Improve the ergonomics of browsing and restoring historical, messy research sessions.
- **Investigation Ergonomics:** Refine the "Investigation Focus Mode" for deeper contextual linking between the chart and the hypothesis layer.

## 9. Technical Notes
- `QuantMorphField` transition continuity fixes are active and must be preserved (eased morph transitions, stable vertex mapping).
- `currentBasePos` drift fix is implemented; do not revert the center-locking logic.
- Mobile scaling refinement (reduced camera FOV/scale and lower particle density on `< 768px`) is active in `QuantMorphField`.
