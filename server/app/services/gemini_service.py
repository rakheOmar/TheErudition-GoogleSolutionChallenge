from __future__ import annotations

import os
from typing import Any

import google.genai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
_model = None


def get_model():
    global _model
    if not _model and GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        _model = genai.GenerativeModel("gemini-2.0-flash")
    return _model


async def explain_recommendation(shipment: dict[str, Any], recommendation: dict[str, Any]) -> str:
    model = get_model()
    if not model:
        return "Gemini API not configured"

    prompt = f"""
Explain this logistics recommendation in simple terms:

Shipment: {shipment.get('id', 'N/A')}
Corridor: {shipment.get('corridor_id', 'N/A')}
Load Profile: {shipment.get('load_profile_id', 'N/A')}
SLA: {shipment.get('sla_eta_h', 'N/A')} hours
Status: {shipment.get('status', 'N/A')}

Recommended Action: {recommendation.get('action', 'N/A')}
Confidence: {recommendation.get('confidence', 0) * 100:.0f}%
Risk: {recommendation.get('expected_impact', {}).get('risk', 'N/A')}
ETA: {recommendation.get('expected_impact', {}).get('eta_h', 'N/A')} hours

Reason Codes: {', '.join(recommendation.get('reason_codes', []))}

Provide a concise 2-3 sentence explanation of why this action was recommended.
"""
    try:
        response = await model.generate_content_async(prompt)
        return response.text or "No explanation generated"
    except Exception as e:
        print(f"Gemini API error: {e}")
        return f"Explanation unavailable: {str(e)}"
