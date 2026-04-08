from fastapi import APIRouter

from app.services.incident_service import get_dashboard_summary, get_graph_snapshot, list_incidents

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_stats():
    snapshot = get_dashboard_summary()
    return {"status": "success", **snapshot["summary"]}


@router.get("/incidents")
def get_incidents():
    return {"status": "success", "incidents": list_incidents(limit=100)}


@router.get("/graph")
def get_graph():
    return get_graph_snapshot()
