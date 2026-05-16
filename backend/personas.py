from typing import List, Dict, Optional
import time

class Persona:
    def __init__(
        self,
        persona_id: str,
        name: str,
        description: str,
        reasoning_style: str,
        risk_preference: str,
        strategy_mapping: str,
        bias_tendencies: List[str] = None,
        prompt_template: str = "",
        version: str = "v1"
    ):
        self.persona_id = persona_id
        self.name = name
        self.description = description
        self.reasoning_style = reasoning_style
        self.risk_preference = risk_preference
        self.strategy_mapping = strategy_mapping  # Maps to a calculation logic
        self.bias_tendencies = bias_tendencies or []
        self.prompt_template = prompt_template
        self.version = version

    def to_dict(self) -> Dict:
        return {
            "persona_id": self.persona_id,
            "name": self.name,
            "description": self.description,
            "reasoning_style": self.reasoning_style,
            "risk_preference": self.risk_preference,
            "strategy_mapping": self.strategy_mapping,
            "bias_tendencies": self.bias_tendencies,
            "prompt_template": self.prompt_template,
            "version": self.version
        }

DEFAULT_PERSONAS = [
    Persona(
        persona_id="conservative_analyst",
        name="Conservative Analyst",
        description="Prioritizes capital preservation and only acts on high-confidence signals.",
        reasoning_style="Evidence-based, cautious",
        risk_preference="Low",
        strategy_mapping="rsi_ma",
        bias_tendencies=["Confirmation bias", "Loss aversion"],
        prompt_template="You are a conservative financial analyst. Analyze the following market data and provide a cautious recommendation focusing on long-term stability.",
        version="v1.1"
    ),
    Persona(
        persona_id="momentum_trader",
        name="Momentum Trader",
        description="Seeks to capitalize on strong market trends.",
        reasoning_style="Trend-following, aggressive",
        risk_preference="High",
        strategy_mapping="price_change",
        bias_tendencies=["Recency bias", "FOMO"],
        prompt_template="You are a momentum trader. Look for strong price movements and identify entry points for trend continuation.",
        version="v1.2"
    ),
    Persona(
        persona_id="contrarian_trader",
        name="Contrarian Trader",
        description="Identifies overextended markets and bets on mean reversion.",
        reasoning_style="Counter-trend, analytical",
        risk_preference="Medium-High",
        strategy_mapping="combined",
        bias_tendencies=["Overconfidence bias"],
        prompt_template="You are a contrarian trader. Look for signs of market exhaustion and potential reversal points.",
        version="v1.0"
    ),
    Persona(
        persona_id="risk_manager",
        name="Risk Manager",
        description="Focuses on downside protection and position sizing.",
        reasoning_style="Mathematical, defensive",
        risk_preference="Very Low",
        strategy_mapping="combined",
        bias_tendencies=["Prudence bias"],
        prompt_template="You are a risk manager. Evaluate the current market conditions primarily from a risk mitigation perspective.",
        version="v1.0"
    )
]

class PersonaManager:
    def __init__(self):
        self.personas = {p.persona_id: p for p in DEFAULT_PERSONAS}

    def get_persona(self, persona_id: str) -> Optional[Persona]:
        return self.personas.get(persona_id)

    def list_personas(self) -> List[Dict]:
        return [p.to_dict() for p in self.personas.values()]
