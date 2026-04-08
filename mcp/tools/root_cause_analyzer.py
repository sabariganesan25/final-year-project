import json
import os

from app.services.incident_service import analyze_dependencies, build_fallback_rca, get_blast_radius, get_incident


async def analyze_root_cause(incident_id: str) -> dict:
    incident = get_incident(incident_id)
    if not incident:
        return {"status": "error", "message": "Incident not found"}

    dependencies = analyze_dependencies(incident["service"])
    blast_radius = get_blast_radius(incident["service"])
    graph_context = {
        "incident": incident,
        "dependencies": dependencies,
        "blast_radius": blast_radius,
    }

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if api_key:
        try:
            import google.generativeai as genai

            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-pro-latest")
            prompt = f"""
You are an expert SRE. Use only the graph-native context below from Neo4j.
Return JSON with keys:
root_cause, contributing_factors, recommended_fix, risk_level, estimated_recovery_time,
affected_services, dependency_chain, responsible_team, explanation, evidence

GRAPH CONTEXT:
{json.dumps(graph_context, indent=2)}
"""
            response = model.generate_content(prompt)
            return {"status": "success", "analysis": response.text}
        except Exception as exc:
            return {"status": "error", "message": f"Gemini API Error: {exc}", "fallback": build_fallback_rca(incident)}

    fallback = build_fallback_rca(incident)
    fallback["graph_context"] = graph_context
    return fallback
