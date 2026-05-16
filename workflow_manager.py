import json
import os
from typing import List, Dict, Any, Optional

class WorkflowManager:
    def __init__(self):
        self.presets = self._initialize_presets()

    def _initialize_presets(self) -> List[Dict]:
        return [
            {
                "preset_id": "volatility_regime_study",
                "title": "Volatility Regime Study",
                "recommended_mode": "REVIEW",
                "description": "Systematically review how different personas adapt to high-volatility market conditions.",
                "focus": ["market_regime", "outcomes", "persona_comparison"],
                "workflow_steps": [
                    {"id": "filter_volatile", "label": "Filter Volatile Signals", "guidance": "Set the market regime filter to 'Volatile' in the Decision Journal."},
                    {"id": "compare_reasoning", "label": "Compare Persona Reasoning", "guidance": "Select signals from different personas at similar timestamps to compare their analytical logic."},
                    {"id": "inspect_replay", "label": "Inspect Replay Evidence", "guidance": "Use 'Show on Chart' to verify if indicator snapshots justify the model's confidence."},
                    {"id": "review_outcomes", "label": "Review 5m/15m Outcomes", "guidance": "Check if high-confidence signals actually resulted in expected price movements."},
                    {"id": "add_annotations", "label": "Add Qualitative Tags", "guidance": "Tag failed trades with specific taxonomy types (e.g., Overconfidence)."},
                    {"id": "synthesize_insight", "label": "Synthesize Finding", "guidance": "Create a new Research Insight summarizing your findings for this regime."}
                ]
            },
            {
                "preset_id": "contrarian_failure_review",
                "title": "Contrarian Failure Review",
                "recommended_mode": "REVIEW",
                "description": "Analyze why Contrarian personas often fail during strong trending markets.",
                "focus": ["persona_drift", "failure_taxonomy", "replay"],
                "workflow_steps": [
                    {"id": "filter_contrarian", "label": "Focus on Contrarian Persona", "guidance": "Filter the journal for the 'contrarian_trader' persona."},
                    {"id": "identify_failures", "label": "Identify Negative Outcomes", "guidance": "Look for signals with negative outcome percentages in trending regimes."},
                    {"id": "check_drift", "label": "Check Reasoning Drift", "guidance": "Inspect if the persona's reasoning signature changed significantly during the failure period."},
                    {"id": "walkthrough_replay", "label": "Step-by-Step Replay", "guidance": "Replay the market context to see if the reversal signals were premature."},
                    {"id": "annotate_blind_spots", "label": "Annotate Blind Spots", "guidance": "Record detailed notes on what the persona 'missed' in its technical analysis."}
                ]
            },
            {
                "preset_id": "post_mortem_outcome_review",
                "title": "Post-Mortem Outcome Review",
                "recommended_mode": "REVIEW",
                "description": "Conduct a thorough post-mortem on recent trades with the highest price delta.",
                "focus": ["outcomes", "annotations", "governance"],
                "workflow_steps": [
                    {"id": "sort_outcomes", "label": "Sort by Outcome Magnitude", "guidance": "Find the signals with the largest absolute price deltas (wins or losses)."},
                    {"id": "verify_governance", "label": "Check Governance Metadata", "guidance": "Verify if these high-impact signals have valid indicators and replay data."},
                    {"id": "add_post_mortem", "label": "Write Post-Mortem Notes", "guidance": "Write a detailed explanation for each high-impact event."},
                    {"id": "archive_study", "label": "Archive Research State", "guidance": "Snapshot this state to preserve the post-mortem analysis for the audit trail."}
                ]
            }
        ]

    def list_presets(self) -> List[Dict]:
        return self.presets

    def get_preset(self, preset_id: str) -> Optional[Dict]:
        return next((p for p in self.presets if p["preset_id"] == preset_id), None)
