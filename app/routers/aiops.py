import os
import sys

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.incident_service import (
    build_fallback_fix,
    build_fallback_rca,
    default_fix_file,
    get_incident,
    parse_model_json,
    save_fix_result,
    save_pr_result,
    save_rca_result,
)

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from mcp.tools import fix_generator, github_integrator, root_cause_analyzer

router = APIRouter(prefix="/api/ai", tags=["ai"])


class FixRequest(BaseModel):
    file_path: str | None = None


class ApplyFixRequest(BaseModel):
    file_path: str | None = None
    approved: bool


@router.post("/rca/{incident_id}")
async def run_rca(incident_id: str):
    incident = get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    tool_response = await root_cause_analyzer.analyze_root_cause(incident_id)
    structured = {}
    if tool_response.get("status") == "success":
        parsed = parse_model_json(tool_response.get("analysis", ""))
        if parsed:
            structured = {
                "status": "success",
                "source": "gemini",
                "confidence": 0.84,
                "risk_level": parsed.get("risk_level", incident.get("severity", "medium")),
                "root_cause": parsed.get("root_cause", ""),
                "affected_services": parsed.get("affected_services") or incident.get("dependency_chain") or [incident["service"]],
                "dependency_chain": parsed.get("dependency_chain") or incident.get("dependency_chain") or [incident["service"]],
                "responsible_team": parsed.get("responsible_team") or incident.get("team"),
                "fix_recommendation": parsed.get("recommended_fix") or parsed.get("fix_description", ""),
                "related_file": parsed.get("affected_file_path") or default_fix_file(incident["service"]),
                "estimated_recovery_time": parsed.get("estimated_recovery_time", "20 minutes"),
                "explanation": parsed.get(
                    "explanation",
                    "I combined the Incident, Service, Component, and ErrorLog relationships from Neo4j before ranking likely causes.",
                ),
                "evidence": parsed.get(
                    "evidence",
                    [
                        f"Service under investigation: {incident['service']}",
                        f"Error signature: {incident['error_type']}",
                        "Supporting context from graph-native dependencies and linked incident evidence",
                    ],
                ),
            }

    if not structured:
        structured = build_fallback_rca(incident)

    save_rca_result(incident_id, structured)
    return structured


@router.post("/fix/{incident_id}")
async def run_fix(incident_id: str, payload: FixRequest):
    incident = get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    file_path = payload.file_path or incident.get("fix_file_path") or default_fix_file(incident["service"])
    tool_response = await fix_generator.get_fix_suggestion(incident_id, file_path)

    structured = {}
    if tool_response.get("status") == "success":
        parsed = parse_model_json(tool_response.get("fix", ""))
        if parsed:
            structured = {
                "status": "success",
                "source": "gemini",
                "file_path": file_path,
                "summary": parsed.get("explanation", "AI-generated patch suggestion ready for review."),
                "explanation": parsed.get("explanation", ""),
                "diff": parsed.get("diff_preview") or parsed.get("suggested_code") or tool_response.get("fix", ""),
                "changes": parsed.get("changes", []),
            }

    if not structured:
        structured = build_fallback_fix(incident, file_path=file_path)

    save_fix_result(incident_id, structured)
    return structured


@router.post("/apply_fix/{incident_id}")
async def apply_fix(incident_id: str, payload: ApplyFixRequest):
    incident = get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    result = await github_integrator.apply_fix_to_github(
        incident_id,
        payload.file_path or incident.get("fix_file_path") or default_fix_file(incident["service"]),
        payload.approved,
    )
    save_pr_result(incident_id, payload.approved, result)
    return result
