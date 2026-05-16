import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

class WalkthroughManager:
    def __init__(self, walkthroughs_path: str = "research_walkthroughs.json"):
        self.walkthroughs_path = walkthroughs_path

    def _load_walkthroughs(self) -> List[Dict]:
        if not os.path.exists(self.walkthroughs_path):
            return []
        try:
            with open(self.walkthroughs_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except (json.JSONDecodeError, Exception):
            return []

    def _save_walkthroughs(self, walkthroughs: List[Dict]):
        with open(self.walkthroughs_path, "w", encoding="utf-8") as f:
            json.dump(walkthroughs, f, ensure_ascii=False, indent=2)

    def create_walkthrough(self, title: str, description: str, steps: List[Dict]) -> Dict:
        """
        steps: List of { 
            "step_id": str, 
            "label": str, 
            "timestamp": str, 
            "symbol": str, 
            "signal_id": Optional[str], 
            "notes": str,
            "regime_hint": Optional[str]
        }
        """
        walkthroughs = self._load_walkthroughs()
        
        new_walkthrough = {
            "walkthrough_id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "steps": steps,
            "created_at": datetime.now().isoformat(),
            "metadata": {
                "schema_version": "1.7",
                "replay_version": "v1"
            }
        }
        
        walkthroughs.append(new_walkthrough)
        self._save_walkthroughs(walkthroughs)
        return new_walkthrough

    def list_walkthroughs(self) -> List[Dict]:
        return self._load_walkthroughs()

    def get_walkthrough(self, walkthrough_id: str) -> Optional[Dict]:
        walkthroughs = self._load_walkthroughs()
        return next((w for w in walkthroughs if w["walkthrough_id"] == walkthrough_id), None)

    def delete_walkthrough(self, walkthrough_id: str) -> bool:
        walkthroughs = self._load_walkthroughs()
        initial_len = len(walkthroughs)
        walkthroughs = [w for w in walkthroughs if w["walkthrough_id"] != walkthrough_id]
        if len(walkthroughs) < initial_len:
            self._save_walkthroughs(walkthroughs)
            return True
        return False

    def get_walkthrough_presets(self) -> List[Dict]:
        """기본 제공 가이드 워크스루 프리셋 반환"""
        return [
            {
                "walkthrough_id": "intro_to_volatility",
                "title": "Understanding Volatility Blindness",
                "description": "A guided tour through 5 historical cases where AI personas failed to recognize high-risk volatility.",
                "steps": [
                    {
                        "step_id": "step_1",
                        "label": "The Quiet Before",
                        "timestamp": "2024-05-14T10:00:00Z",
                        "symbol": "BTC/USDT",
                        "notes": "Observe how indicators show low volatility. Persona A is building confidence.",
                        "regime_hint": "sideways"
                    },
                    {
                        "step_id": "step_2",
                        "label": "The Spike",
                        "timestamp": "2024-05-14T10:15:00Z",
                        "symbol": "BTC/USDT",
                        "notes": "Volatility spikes suddenly. Persona A ignores the risk and doubles down.",
                        "regime_hint": "volatile"
                    }
                ]
            },
            {
                "walkthrough_id": "contrarian_success",
                "title": "Anatomy of a Contrarian Win",
                "description": "Step-by-step breakdown of how the Contrarian persona identified a major reversal peak.",
                "steps": []
            }
        ]
