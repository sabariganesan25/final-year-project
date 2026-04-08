from app.services.incident_service import get_system_health


async def check_service_health() -> dict:
    payload = get_system_health()
    return {service["name"].lower().replace(" ", "_"): service["status"] for service in payload["services"]}
