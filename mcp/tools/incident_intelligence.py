from collections import Counter, defaultdict
from datetime import timedelta

from app.services.incident_service import get_incident, list_incidents, parse_datetime, predict_severity, utcnow


async def predict_incident_severity(incident_id: str = "", error_type: str = "", error_message: str = "") -> dict:
    if incident_id:
        incident = get_incident(incident_id)
        if incident:
            return {
                "status": "success",
                "incident_id": incident_id,
                "predicted_severity": predict_severity(incident["error_type"], incident.get("error_message", "")),
                "service": incident["service"],
            }

    return {
        "status": "success",
        "predicted_severity": predict_severity(error_type, error_message),
        "service": "unknown",
    }


async def cluster_similar_incidents(hours: int = 168) -> dict:
    incidents = list_incidents(limit=500, hours=hours)
    clusters = defaultdict(list)

    for incident in incidents:
        key = f"{incident['service']}::{incident['error_type']}"
        clusters[key].append(
            {
                "id": incident["id"],
                "timestamp": incident["timestamp"],
                "severity": incident["severity"],
                "status": incident["status"],
            }
        )

    ordered_clusters = sorted(
        (
            {
                "cluster_key": key,
                "service": key.split("::", 1)[0],
                "error_type": key.split("::", 1)[1],
                "count": len(items),
                "incidents": items[:10],
            }
            for key, items in clusters.items()
        ),
        key=lambda entry: (-entry["count"], entry["cluster_key"]),
    )

    return {"status": "success", "clusters": ordered_clusters}


async def detect_incident_anomalies(hours: int = 24) -> dict:
    recent = list_incidents(limit=500, hours=hours)
    baseline = list_incidents(limit=500, hours=hours * 2)

    cutoff = utcnow() - timedelta(hours=hours)
    baseline_only = [
        incident for incident in baseline
        if parse_datetime(incident["timestamp"]) and parse_datetime(incident["timestamp"]) < cutoff
    ]

    recent_counts = Counter(incident["service"] for incident in recent)
    baseline_counts = Counter(incident["service"] for incident in baseline_only)

    anomalies = []
    for service, recent_count in recent_counts.items():
        previous = baseline_counts.get(service, 0)
        if recent_count >= max(2, previous * 2 or 2):
            anomalies.append(
                {
                    "service": service,
                    "recent_count": recent_count,
                    "baseline_count": previous,
                    "signal": "spike",
                }
            )

    anomalies.sort(key=lambda entry: (-entry["recent_count"], entry["service"]))
    return {"status": "success", "anomalies": anomalies}
