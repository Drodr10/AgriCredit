import logging

logger = logging.getLogger(__name__)

class AgricreditModel:
    def predict_risk(self, input_data: dict) -> dict:
        return {
            "pd": 0.18,
            "risk_tier": "LOW",
            "expected_loss": 9000.0,
            "baseline_pd": 0.26,
            "farmer_summary": ["Rainfall normal...", "Yields stable..."],
            "feature_importance": [
                {"name": "SPEI Drought", "weight": 0.32, "value": "-0.8"}
            ],
            "model_comparison": {"baseline_auc": 0.72, "enhanced_auc": 0.89}
        }

def load_models():
    logger.info("Loading ML models...")
    return AgricreditModel()

