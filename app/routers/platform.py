import time

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel

from app.services.incident_service import (
    get_dashboard_summary,
    get_graph_snapshot,
    get_incident,
    get_mttr_analytics,
    get_recent_logs,
    get_system_health,
    list_incidents,
    update_incident,
)

router = APIRouter(prefix="/api/platform", tags=["platform"])


class IncidentUpdateRequest(BaseModel):
    status: str | None = None
    assignee: str | None = None
    resolution_summary: str | None = None


class DatabaseCrashError(RuntimeError):
    pass


class RedisOOMError(RuntimeError):
    pass


class UpstreamTimeoutError(RuntimeError):
    pass


class SearchIndexError(RuntimeError):
    pass


class InventoryOversellError(RuntimeError):
    pass


@router.get("/summary")
def summary():
    return {"status": "success", **get_dashboard_summary()}


@router.get("/incidents")
def incidents(
    severity: str | None = None,
    service: str | None = None,
    status: str | None = None,
    hours: int | None = Query(default=None, ge=1, le=168),
    query: str | None = None,
    limit: int = Query(default=100, ge=1, le=500),
):
    return {
        "status": "success",
        "incidents": list_incidents(
            limit=limit,
            severity=severity,
            service=service,
            status=status,
            hours=hours,
            query=query,
        ),
    }


@router.get("/incidents/{incident_id}")
def incident_detail(incident_id: str):
    incident = get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"status": "success", "incident": incident}


@router.patch("/incidents/{incident_id}")
def patch_incident(incident_id: str, payload: IncidentUpdateRequest):
    incident = update_incident(
        incident_id,
        status=payload.status,
        assignee=payload.assignee,
        resolution_summary=payload.resolution_summary,
    )
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"status": "success", "incident": incident}


@router.get("/logs/recent")
def recent_logs(limit: int = Query(default=80, ge=10, le=500)):
    return {"status": "success", "logs": get_recent_logs(limit=limit)}


@router.get("/analytics/mttr")
def analytics():
    return get_mttr_analytics()


@router.get("/health")
def health():
    return get_system_health()


@router.get("/graph")
def graph():
    return get_graph_snapshot()


@router.post("/simulate/{scenario}")
def simulate_failure(scenario: str, request: Request):
    if scenario == "db-crash":
        request.state.service_name = "orders"
        request.state.error_type_override = "GraphTransactionError"
        raise DatabaseCrashError("GraphTransactionError: Neo4j order write transaction timed out")

    if scenario == "redis-oom":
        request.state.service_name = "cart"
        request.state.error_type_override = "RedisOOMError"
        raise RedisOOMError("RedisOOMError: Cache maxmemory reached while storing cart payload")

    if scenario == "api-timeout":
        request.state.service_name = "payments"
        request.state.error_type_override = "UpstreamTimeoutError"
        time.sleep(1)
        raise UpstreamTimeoutError("APITimeoutError: Payment gateway exceeded upstream timeout")

    if scenario == "search-index":
        request.state.service_name = "search"
        request.state.error_type_override = "SearchIndexMismatch"
        raise SearchIndexError("SearchIndexMismatch: product ranking query referenced a missing graph property")

    if scenario == "inventory-oversell":
        request.state.service_name = "inventory"
        request.state.error_type_override = "InventoryOversell"
        raise InventoryOversellError("InventoryOversell: stock reservation failed because available quantity dropped below zero")

    raise HTTPException(status_code=404, detail="Unknown simulation scenario")
