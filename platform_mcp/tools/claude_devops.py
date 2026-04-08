from app.services.incident_service import get_incident
from platform_mcp.tools.fix_generator import get_fix_suggestion
from platform_mcp.tools.github_integrator import apply_fix_to_github
from platform_mcp.tools.incident_search import get_blast_radius_for_service, get_service_dependencies, search_incidents
from platform_mcp.tools.root_cause_analyzer import analyze_root_cause


async def analyze_dependencies(service_name: str) -> dict:
    return await get_service_dependencies(service_name)


async def get_metadata(incident_id: str) -> dict:
    incident = get_incident(incident_id)
    if not incident:
        return {"status": "error", "message": "Incident not found"}

    return {
        "status": "success",
        "incident": incident,
        "metadata": {
            "service": incident["service"],
            "severity": incident["severity"],
            "status": incident["status"],
            "team": incident.get("responsible_team") or incident.get("team"),
            "affected_services": incident.get("affected_services", []),
            "dependency_chain": incident.get("dependency_chain", []),
        },
    }


async def get_blast_radius(service_name: str) -> dict:
    return await get_blast_radius_for_service(service_name)


async def generate_rca(incident_id: str) -> dict:
    return await analyze_root_cause(incident_id)


async def suggest_fix(incident_id: str, file_path: str) -> dict:
    return await get_fix_suggestion(incident_id, file_path)


async def approve_fix(incident_id: str, file_path: str, approved: bool = True) -> dict:
    return await apply_fix_to_github(incident_id, file_path, approved)
