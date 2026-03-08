"""
Gemini-powered PDF report generation.

Sends raw ML analysis data to Gemini API, which generates a professional
2-page lender report as self-contained HTML. The frontend opens this HTML
in a new window for print-to-PDF.
"""

import json
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse

from google import genai

from app.core.config import settings
from app.core.database import get_database

router = APIRouter(prefix="/reports", tags=["reports"])

# ──────────────────────────────────────────────────
# Gemini system prompt: full lender report spec
# ──────────────────────────────────────────────────
REPORT_SYSTEM_PROMPT = """You are Agricredit's Senior Credit Underwriter. Transform the provided ML output, farmer profile, and environmental data into a professional, print-ready, high-stakes technical HTML report for loan underwriting.

## THE CORE MISSION: BEYOND DATA REPETITION
Your report must not simply restate the numbers. It must SYNTHESIZE them into a narrative of operational risk and resilience. A lender reading this should understand the 'Why' behind the 'What'.

### PAGE 1: EXECUTIVE SUMMARY (The Quantitative Snapshot)
- **HEADER**: Agricredit logo (green diamond ◆ icon) | [Farm Name] - Loan Underwriting Report | [Loan Amount] | [Crop/Season] | [Today's Date] | Page 1/2
- **Risk Dashboard**: Large, prominent colored badge reflecting the Risk Tier (GREEN: LOW, AMBER: MEDIUM, RED: HIGH).
- **Core KPIs Row**: Probability of Default (PD) | Expected Loss (EL) | DSC Ratio | Loan-to-Value (LTV).
- **Executive Recommendation**: Clear APPROVE/CAUTION/DECLINE signal. Provide a 2-3 sentence technical justification. Mention the 'Avoided Loss vs Baseline' to prove the efficacy of the enhanced model.
- **Key Lending Metrics Table**: DSC Ratio, LTV, Equity Ratio, PD vs Baseline, and Collateral Value. Each row must have a value and a qualitative Status Indicator (e.g., 'OPTIMAL', 'CONSERVATIVE', 'HIGH EXPOSURE').

### PAGE 2: 5 C's TECHNICAL ANALYSIS (The Qualitative Depth)
This page is where you demonstrate the 'Technical Edge'. Synthesize the data into these sections:

- **1. Capacity (Repayment Ability)**: Don't just list the DSC ratio. Analyze it in the context of the farm scale and crop choice. Explain if the 1.5x or 4x coverage is typical for this crop/season and why it provides confidence.
- **2. Capital (Financial Strength)**: Evaluate the Equity Ratio. Mention the liquidity buffer and how it protects against market shocks.
- **3. Collateral (Security Position)**: Analyze the collateral mix. If machinery is mentioned (e.g., $25k value), discuss how these assets support operational continuity. Relate the LTV to the 'Collateral Value'.
- **4. Character (Operational Experience)**: Weave a story around the farmer's experience years and location. E.g., 'With 12 years of experience in Punjab, the operator demonstrates seasoned stewardship of loamy soil environments...'.
- **5. Conditions (The ML Edge - Climate & Market)**: This is the most technical section. 
    - **Synthesis**: Combine the SPEI Drought Index, Rainfall Forecast, and Soil Type. E.g., 'While the SPEI index suggests moderate drought pressure, the loamy soil type and drip irrigation presence (if applicable) provide a critical moisture-retention hedge.'
    - **Feature Importance Chart**: Horizontal bar chart showing top risk drivers with percentage weights.
    - **ML Model Validation**: AUC comparison. Explicitly state: 'XGBoost 95% vs Baseline 71% -> 34% better risk detection accuracy'.

### STYLE & TONE
- **Banker-First Aesthetic**: Use Tailwind CSS (CDN). Clean, grid-based layout. Green (#10B981) for positives, Navy (#1E3A8A) for text/headers.
- **Tone**: Technical, conservative, authoritative. Use terms like 'Operational Hedge', 'Volatility Exposure', 'Liquidity Buffer', 'Seasoned Stewardship'.
- **Print-Optimized**: A4 Landscape. Ensure no text is cut off and page breaks are clean.

## CRITICAL RULES
1. NEVER invent numbers. Use the provided JSON data exactly.
2. Output ONLY the raw HTML document (start with <!DOCTYPE html>). No markdown, no intro text.
3. Make QUALITATIVE assessments. If the soil is loamy and there's a drought index, explain that loamy soil is a hedge due to water retention. If they have machinery, explain that it implies mechanized efficiency.
"""


def _build_report_data(application: dict, farm: dict, user: dict) -> dict:
    """Build the structured data payload for Gemini."""
    return {
        "farmer_profile": {
            "farm_name": farm.get("name", "Unknown Farm"),
            "experience_years": user.get("experience_years", 0),
            "state": farm.get("location", "Unknown"),
            "soil_type": farm.get("soil_category", "unknown"),
            "irrigation": farm.get("irrigation_type", "unknown"),
            "machinery": farm.get("machinery_type", "unknown"),
            "farm_scale_ha": farm.get("farm_size_hectares", 0),
        },
        "loan_request": {
            "crop": application.get("crop_type", "unknown"),
            "season": application.get("season", "unknown"),
            "loan_amount": application.get("amount_requested", 0),
            "purpose": application.get("loan_purpose", "general"),
            "has_insurance": application.get("has_insurance", False),
        },
        "ml_outputs": {
            "pd": application.get("bad_season_probability", 0),
            "risk_tier": application.get("risk_tier", "UNKNOWN"),
            "expected_loss": application.get("expected_loss", 0),
            "baseline_pd": application.get("baseline_pd", 0),
            "dsc_ratio": application.get("dsc_ratio", 0),
            "ltv": application.get("ltv", 0),
            "suggested_rate": application.get("suggested_interest_rate", 0),
            "equity_ratio": application.get("equity_ratio", 0),
            "collateral_value": application.get("collateral_value", 0),
            "llm_capacity": application.get("llm_capacity", ""),
            "llm_collateral": application.get("llm_collateral", ""),
            "feature_importance": application.get("feature_importance", []),
            "model_comparison": application.get("model_comparison", {}),
        },
        "reasoning": {
            "rainfall_forecast": application.get("rainfall_forecast", ""),
            "yield_stability": application.get("yield_stability", ""),
            "price_volatility": application.get("price_volatility", ""),
        },
        "metadata": {
            "scenario_id": application.get("scenario_id", ""),
            "generated_at": datetime.now(timezone.utc).strftime("%B %d, %Y"),
            "model_confidence": application.get("model_confidence", ""),
        },
    }


@router.post("/generate/{application_id}", response_class=HTMLResponse)
async def generate_report(application_id: str) -> HTMLResponse:
    """
    Generate a Gemini-powered lender report for a credit application.
    Returns self-contained HTML ready for print-to-PDF.
    """
    # 1. Check API key
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key not configured. Add GEMINI_API_KEY to your .env file.",
        )

    # 2. Fetch application
    db = get_database()
    try:
        oid = ObjectId(application_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid application ID")

    application = db.credit_applications.find_one({"_id": oid})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # 3. Fetch user and farm data
    clerk_id = application.get("clerk_id")
    farmer_id = application.get("farmer_id")

    user_doc = db.users.find_one({"clerk_id": clerk_id}) or {}
    farms = user_doc.get("farms", [])
    farm = next((f for f in farms if f.get("id") == farmer_id), {})

    # 4. Build data payload
    report_data = _build_report_data(application, farm, user_doc)

    # 5. Call Gemini API
    client = genai.Client(api_key=settings.gemini_api_key)

    user_prompt = f"""Generate a complete lender report using this EXACT data:

{json.dumps(report_data, indent=2, default=str)}

Remember: use the EXACT values from the data above. Output ONLY the complete HTML document."""

    try:
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=user_prompt,
            config={
                "system_instruction": REPORT_SYSTEM_PROMPT,
                "temperature": 0.3,
            },
        )
        print(response.text)
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            detail = (
                "Gemini API quota exceeded. If this is a new key, it may take a few minutes to activate. "
                "Also check if the 'Generative Language API' is enabled. Error: " + error_msg
            )
        elif "404" in error_msg or "not found" in error_msg.lower():
            detail = (
                f"Model 'gemini-3.1-flash-lite-preview' not found for this API key. "
                "Please check your AI Studio dashboard for the 'API Name' of the model you have quota for. "
                "Error: " + error_msg
            )
        else:
            detail = f"Gemini API error: {error_msg}"
        
        raise HTTPException(status_code=502, detail=detail)

    # 6. Extract HTML from response
    html_content = response.text or ""

    # Strip markdown fences if Gemini wraps them
    if html_content.startswith("```html"):
        html_content = html_content[7:]
    if html_content.startswith("```"):
        html_content = html_content[3:]
    if html_content.endswith("```"):
        html_content = html_content[:-3]
    html_content = html_content.strip()

    if not html_content:
        raise HTTPException(status_code=502, detail="Gemini returned empty response")

    return HTMLResponse(content=html_content)
