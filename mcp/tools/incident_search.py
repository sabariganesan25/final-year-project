from app.services.incident_service import analyze_dependencies, get_blast_radius, get_dashboard_summary, search_incidents_graph


async def search_incidents(query: str, service: str = None, hours_back: int = 24) -> dict:
    incidents = search_incidents_graph(query=query, service=service, hours_back=hours_back)
    return {"status": "success", "count": len(incidents), "incidents": incidents}


async def get_service_dependencies(service_name: str) -> dict:
    return analyze_dependencies(service_name)


async def get_blast_radius_for_service(service_name: str) -> dict:
    result = get_blast_radius(service_name)
    return {"status": "success", **result}


async def get_incident_stats(service: str = None, days: int = 7) -> dict:
    snapshot = get_dashboard_summary()
    incidents = snapshot["recent_incidents"] if service is None else [incident for incident in snapshot["recent_incidents"] if incident["service"] == service]
    return {
        "status": "success",
        "total_incidents": snapshot["summary"]["total_incidents"],
        "active_incidents": snapshot["summary"]["active_incidents"],
        "recent_incidents": incidents,
    }
