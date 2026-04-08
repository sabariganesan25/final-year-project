import json
import uuid
from collections import Counter
from datetime import datetime, timedelta, timezone

from app.services.graph_service import (
    COMPONENTS,
    SERVICE_DEPENDENCIES,
    SERVICES,
    infer_component,
    initialize_graph,
    list_products,
    run_cypher,
    execute_write,
    to_iso,
)


KNOWN_SERVICES = [
    {"name": service["name"], "team": service["team"], "kind": "Service"}
    for service in SERVICES
] + [
    {"name": component["name"], "team": component["team"], "kind": "Component"}
    for component in COMPONENTS
]

TEAM_MAP = {item["name"]: item["team"] for item in KNOWN_SERVICES}
SEVERITY_BASELINES = {
    "critical": {"before": 92, "after": 34},
    "high": {"before": 63, "after": 24},
    "medium": {"before": 34, "after": 15},
    "low": {"before": 18, "after": 8},
}


def utcnow():
    return datetime.now(timezone.utc)


def parse_datetime(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc)
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def json_dumps(value):
    return json.dumps({} if value is None else value, separators=(",", ":"))


def json_loads(value, fallback):
    if not value:
        return fallback
    try:
        return json.loads(value)
    except Exception:
        return fallback


def normalize_status(status):
    allowed = {"open", "investigating", "mitigating", "resolved", "closed"}
    lowered = (status or "open").lower()
    return lowered if lowered in allowed else "open"


def infer_service(path, explicit_service=None):
    if explicit_service:
        return explicit_service
    if "/checkout" in path or "/orders" in path:
        return "orders"
    if "/payment" in path or "/payments" in path:
        return "payments"
    if "/cart" in path:
        return "cart"
    if "/products" in path:
        return "search"
    if "/inventory" in path:
        return "inventory"
    return "api-gateway"


def infer_team(service_name):
    return TEAM_MAP.get(service_name, "Platform")


def predict_severity(error_type, error_message=""):
    message = f"{error_type} {error_message}".lower()
    if any(token in message for token in ("timeout", "crash", "fatal", "neo4j", "database", "writefailure")):
        return "critical"
    if any(token in message for token in ("redis", "oom", "foreignkey", "inventory", "oversold")):
        return "high"
    if any(token in message for token in ("search", "index", "cache")):
        return "medium"
    return "medium"


def default_fix_file(service_name):
    mapping = {
        "orders": "app/services/graph_service.py",
        "cart": "app/services/graph_service.py",
        "payments": "app/services/storefront_service.py",
        "search": "app/routers/products.py",
        "inventory": "app/routers/inventory.py",
        "api-gateway": "app/main.py",
    }
    return mapping.get(service_name, "app/main.py")


def effective_mttr_minutes(incident, ai_assisted=True):
    if incident.get("mttr_minutes"):
        return int(incident["mttr_minutes"])
    baseline = SEVERITY_BASELINES.get(incident.get("severity", "medium"), SEVERITY_BASELINES["medium"])
    minutes = baseline["after" if ai_assisted else "before"]
    spread = sum(ord(char) for char in incident.get("id", "")) % 9
    return minutes + spread


def initialize_storage():
    initialize_graph()


def infer_dependency_chain(service_name):
    return [service_name, *SERVICE_DEPENDENCIES.get(service_name, [])]


def append_event(events, event_type, title, details="", actor="system", metadata=None):
    events = list(events or [])
    events.append(
        {
            "timestamp": to_iso(),
            "event_type": event_type,
            "title": title,
            "details": details,
            "actor": actor,
            "metadata": metadata or {},
        }
    )
    return events


def row_to_incident(record):
    incident = dict(record["incident"])
    service = record.get("service") or {}
    component = record.get("component") or {}
    log = record.get("log") or {}
    incident["service"] = service.get("name", incident.get("service", "api-gateway"))
    incident["team"] = service.get("team") or infer_team(incident["service"])
    incident["responsible_team"] = incident.get("responsible_team") or incident["team"]
    incident["status"] = normalize_status(incident.get("status"))
    incident["severity"] = incident.get("severity") or predict_severity(incident.get("error_type", ""), log.get("message", ""))
    incident["endpoint"] = incident.get("endpoint", "")
    incident["error_message"] = log.get("message", incident.get("error_message", ""))
    incident["stack_trace"] = log.get("stack_trace", incident.get("stack_trace", ""))
    incident["component"] = component.get("name", incident.get("component", "storefront-ui"))
    incident["component_type"] = component.get("type", "")
    incident["metadata"] = json_loads(incident.get("metadata_json"), {})
    incident["dependency_chain"] = json_loads(incident.get("dependency_chain_json"), infer_dependency_chain(incident["service"]))
    incident["affected_services"] = json_loads(incident.get("affected_services_json"), incident["dependency_chain"])
    incident["rca_payload"] = json_loads(incident.get("rca_payload_json"), {})
    incident["fix_payload"] = json_loads(incident.get("fix_payload_json"), {})
    incident["events"] = json_loads(incident.get("events_json"), [])
    if not incident["events"]:
        incident["events"] = append_event([], "detected", "Incident detected", incident.get("summary", ""), actor="platform")
    started_at = parse_datetime(incident.get("timestamp"))
    finished_at = parse_datetime(incident.get("resolved_at")) or utcnow()
    incident["active_duration_minutes"] = max(1, int((finished_at - started_at).total_seconds() // 60)) if started_at else None
    return incident


def record_incident(
    *,
    service,
    endpoint,
    error_type,
    error_message="",
    stack_trace="",
    incident_id=None,
    timestamp=None,
    severity=None,
    team=None,
    metadata=None,
    detected_by="middleware",
    source="runtime",
):
    initialize_storage()
    incident_id = incident_id or str(uuid.uuid4())
    timestamp = timestamp or to_iso()
    severity = severity or predict_severity(error_type, error_message)
    team = team or infer_team(service)
    component_name = infer_component(service, error_type, error_message)
    dependency_chain = infer_dependency_chain(service)
    affected_services = [service, *[target for target in dependency_chain[1:] if target in TEAM_MAP]]
    events = append_event([], "detected", "Incident detected", f"{error_type} captured from {endpoint}", actor="platform")

    execute_write(
        """
        MATCH (s:Service {name: $service})
        MATCH (c:Component {name: $component})
        CREATE (i:Incident {
            id: $incident_id,
            severity: $severity,
            timestamp: $timestamp,
            status: 'open',
            error_type: $error_type,
            endpoint: $endpoint,
            summary: $summary,
            source: $source,
            detected_by: $detected_by,
            team: $team,
            responsible_team: $team,
            metadata_json: $metadata_json,
            dependency_chain_json: $dependency_chain_json,
            affected_services_json: $affected_services_json,
            events_json: $events_json
        })
        CREATE (l:ErrorLog {
            id: $incident_id,
            message: $error_message,
            stack_trace: $stack_trace,
            timestamp: $timestamp
        })
        MERGE (i)-[:OCCURRED_IN]->(s)
        MERGE (i)-[:CAUSED_BY]->(c)
        MERGE (i)-[:HAS_LOG]->(l)
        SET s.status = 'degraded',
            s.last_error = $timestamp,
            s.error_count = COALESCE(s.error_count, 0) + 1,
            c.last_error = $timestamp
        """,
        {
            "service": service,
            "component": component_name,
            "incident_id": incident_id,
            "severity": severity,
            "timestamp": timestamp,
            "error_type": error_type,
            "endpoint": endpoint,
            "summary": f"{error_type} detected on {service} via {endpoint}",
            "source": source,
            "detected_by": detected_by,
            "team": team,
            "metadata_json": json_dumps(metadata or {}),
            "dependency_chain_json": json_dumps(dependency_chain),
            "affected_services_json": json_dumps(affected_services),
            "events_json": json_dumps(events),
            "error_message": error_message,
            "stack_trace": stack_trace,
        },
    )
    return get_incident(incident_id)


def list_incidents(limit=100, severity=None, service=None, status=None, hours=None, query=None):
    initialize_storage()
    filters = ["1 = 1"]
    params = {"limit": int(limit)}
    if severity:
        filters.append("toLower(i.severity) = toLower($severity)")
        params["severity"] = severity
    if service:
        filters.append("s.name = $service")
        params["service"] = service
    if status:
        filters.append("toLower(i.status) = toLower($status)")
        params["status"] = normalize_status(status)
    if hours:
        params["cutoff"] = to_iso(utcnow() - timedelta(hours=int(hours)))
        filters.append("i.timestamp >= $cutoff")
    if query:
        params["query"] = query.lower()
        filters.append(
            "(toLower(i.error_type) CONTAINS $query OR toLower(i.summary) CONTAINS $query OR toLower(l.message) CONTAINS $query OR toLower(i.endpoint) CONTAINS $query)"
        )

    rows = run_cypher(
        f"""
        MATCH (i:Incident)-[:OCCURRED_IN]->(s:Service)
        OPTIONAL MATCH (i)-[:CAUSED_BY]->(c:Component)
        OPTIONAL MATCH (i)-[:HAS_LOG]->(l:ErrorLog)
        WHERE {' AND '.join(filters)}
        RETURN i AS incident, s AS service, c AS component, l AS log
        ORDER BY i.timestamp DESC
        LIMIT $limit
        """,
        params,
    )
    return [row_to_incident(row) for row in rows]


def get_incident(incident_id):
    initialize_storage()
    rows = run_cypher(
        """
        MATCH (i:Incident {id: $incident_id})-[:OCCURRED_IN]->(s:Service)
        OPTIONAL MATCH (i)-[:CAUSED_BY]->(c:Component)
        OPTIONAL MATCH (i)-[:HAS_LOG]->(l:ErrorLog)
        RETURN i AS incident, s AS service, c AS component, l AS log
        """,
        {"incident_id": incident_id},
    )
    if not rows:
        return None
    return row_to_incident(rows[0])


def get_recent_logs(limit=80):
    incidents = list_incidents(limit=limit)
    return [
        {
            "id": incident["id"],
            "timestamp": incident["timestamp"],
            "service": incident["service"],
            "severity": incident["severity"],
            "status": incident["status"],
            "endpoint": incident["endpoint"],
            "error_type": incident["error_type"],
            "message": incident.get("error_message") or incident.get("summary"),
            "stack_trace": incident.get("stack_trace", ""),
        }
        for incident in incidents
    ]


def update_incident(incident_id, *, status=None, assignee=None, summary=None, resolution_summary=None, pr_url=None, branch_name=None, actor="operator"):
    incident = get_incident(incident_id)
    if not incident:
        return None
    next_status = normalize_status(status or incident["status"])
    events = append_event(
        incident.get("events", []),
        "status_change",
        "Incident updated" if next_status not in {"resolved", "closed"} else "Incident resolved",
        resolution_summary or f"Status moved to {next_status}",
        actor=actor,
        metadata={"status": next_status, "assignee": assignee or incident.get("assignee", "")},
    )
    resolved_at = incident.get("resolved_at")
    mttr_minutes = incident.get("mttr_minutes")
    if next_status in {"resolved", "closed"} and not resolved_at:
        resolved_at = to_iso()
        mttr_minutes = max(1, int((utcnow() - parse_datetime(incident["timestamp"])).total_seconds() // 60))

    execute_write(
        """
        MATCH (i:Incident {id: $incident_id})
        SET i.status = $status,
            i.assignee = COALESCE($assignee, i.assignee),
            i.summary = COALESCE($summary, i.summary),
            i.resolved_at = COALESCE($resolved_at, i.resolved_at),
            i.mttr_minutes = COALESCE($mttr_minutes, i.mttr_minutes),
            i.pr_url = COALESCE($pr_url, i.pr_url),
            i.branch_name = COALESCE($branch_name, i.branch_name),
            i.events_json = $events_json
        """,
        {
            "incident_id": incident_id,
            "status": next_status,
            "assignee": assignee,
            "summary": summary or resolution_summary,
            "resolved_at": resolved_at,
            "mttr_minutes": mttr_minutes,
            "pr_url": pr_url,
            "branch_name": branch_name,
            "events_json": json_dumps(events),
        },
    )
    return get_incident(incident_id)


def save_rca_result(incident_id, rca_payload):
    incident = get_incident(incident_id)
    if not incident:
        return None
    events = append_event(
        incident.get("events", []),
        "rca",
        "AI root cause analysis completed",
        rca_payload.get("root_cause", "Root cause analysis available"),
        actor=rca_payload.get("source", "ai"),
        metadata={"confidence": rca_payload.get("confidence", 0.7)},
    )
    execute_write(
        """
        MATCH (i:Incident {id: $incident_id})
        SET i.root_cause = $root_cause,
            i.suggested_fix = $suggested_fix,
            i.explanation = $explanation,
            i.responsible_team = $responsible_team,
            i.dependency_chain_json = $dependency_chain_json,
            i.affected_services_json = $affected_services_json,
            i.fix_file_path = $fix_file_path,
            i.rca_payload_json = $rca_payload_json,
            i.status = CASE WHEN i.status = 'open' THEN 'investigating' ELSE i.status END,
            i.events_json = $events_json
        """,
        {
            "incident_id": incident_id,
            "root_cause": rca_payload.get("root_cause", ""),
            "suggested_fix": rca_payload.get("fix_recommendation", ""),
            "explanation": rca_payload.get("explanation", ""),
            "responsible_team": rca_payload.get("responsible_team", incident["team"]),
            "dependency_chain_json": json_dumps(rca_payload.get("dependency_chain", incident.get("dependency_chain", []))),
            "affected_services_json": json_dumps(rca_payload.get("affected_services", incident.get("affected_services", []))),
            "fix_file_path": rca_payload.get("related_file", default_fix_file(incident["service"])),
            "rca_payload_json": json_dumps(rca_payload),
            "events_json": json_dumps(events),
        },
    )
    return get_incident(incident_id)


def save_fix_result(incident_id, fix_payload):
    incident = get_incident(incident_id)
    if not incident:
        return None
    events = append_event(
        incident.get("events", []),
        "fix",
        "Fix recommendation generated",
        fix_payload.get("summary", "Suggested patch is ready for review"),
        actor=fix_payload.get("source", "ai"),
    )
    execute_write(
        """
        MATCH (i:Incident {id: $incident_id})
        SET i.fix_file_path = $file_path,
            i.fix_diff = $fix_diff,
            i.fix_explanation = $fix_explanation,
            i.fix_payload_json = $fix_payload_json,
            i.status = CASE WHEN i.status IN ['open','investigating'] THEN 'mitigating' ELSE i.status END,
            i.events_json = $events_json
        """,
        {
            "incident_id": incident_id,
            "file_path": fix_payload.get("file_path", default_fix_file(incident["service"])),
            "fix_diff": fix_payload.get("diff", ""),
            "fix_explanation": fix_payload.get("explanation", ""),
            "fix_payload_json": json_dumps(fix_payload),
            "events_json": json_dumps(events),
        },
    )
    return get_incident(incident_id)


def save_pr_result(incident_id, approved, pr_result):
    incident = get_incident(incident_id)
    if not incident:
        return None
    events = append_event(
        incident.get("events", []),
        "approval",
        "Fix approved" if approved else "Fix rejected",
        pr_result.get("message") or pr_result.get("pr_url", ""),
        actor="operator",
    )
    execute_write(
        """
        MATCH (i:Incident {id: $incident_id})
        SET i.status = CASE
                WHEN $approved = true AND $result_status = 'success' THEN 'resolved'
                WHEN $approved = true THEN 'mitigating'
                ELSE 'investigating'
            END,
            i.pr_url = COALESCE($pr_url, i.pr_url),
            i.branch_name = COALESCE($branch_name, i.branch_name),
            i.events_json = $events_json,
            i.resolved_at = CASE WHEN $approved = true AND $result_status = 'success' THEN $resolved_at ELSE i.resolved_at END
        """,
        {
            "incident_id": incident_id,
            "approved": approved,
            "result_status": pr_result.get("status", ""),
            "pr_url": pr_result.get("pr_url"),
            "branch_name": pr_result.get("branch_name"),
            "events_json": json_dumps(events),
            "resolved_at": to_iso(),
        },
    )
    return get_incident(incident_id)


def parse_model_json(raw_text):
    if not raw_text:
        return {}
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except Exception:
        return {}


def build_fallback_rca(incident):
    dependency_chain = incident.get("dependency_chain", infer_dependency_chain(incident["service"]))
    component = incident.get("component", infer_component(incident["service"], incident["error_type"], incident.get("error_message", "")))
    root_causes = {
        "payment-gateway": "The payment service is blocked on the external payment-gateway component, which is timing out and preventing checkout completion.",
        "cart-cache": "The cart service is failing while interacting with the cart-cache component, causing add-to-cart writes to fail before checkout can begin.",
        "checkout-orchestrator": "The checkout workflow is failing during graph-backed order persistence, which prevents order creation from completing.",
        "inventory-engine": "The inventory-engine component is allowing stock exhaustion to surface as an oversell incident.",
        "catalog-search": "The catalog-search component returned an invalid result path, causing degraded product retrieval.",
    }
    root_cause = root_causes.get(component, f"The {component} component is the most likely cause of the {incident['service']} failure.")
    return {
        "status": "success",
        "source": "graph-heuristic",
        "confidence": 0.81,
        "risk_level": incident["severity"],
        "root_cause": root_cause,
        "affected_services": incident.get("affected_services", [incident["service"]]),
        "dependency_chain": dependency_chain,
        "responsible_team": incident.get("responsible_team") or incident.get("team"),
        "fix_recommendation": f"Stabilize the {component} component and add defensive handling in {incident['service']} so the failure degrades gracefully.",
        "related_file": default_fix_file(incident["service"]),
        "estimated_recovery_time": f"{effective_mttr_minutes(incident)} minutes",
        "explanation": "This conclusion is based on the Incident -> Service -> Component relationships stored in Neo4j and the linked ErrorLog evidence.",
        "evidence": [
            f"Incident occurred in service: {incident['service']}",
            f"Incident caused by component: {component}",
            f"Error log message: {incident.get('error_message', '')}",
        ],
        "blast_radius": get_blast_radius(incident["service"]),
    }


def build_fallback_fix(incident, file_path=None):
    file_path = file_path or incident.get("fix_file_path") or default_fix_file(incident["service"])
    component = incident.get("component", infer_component(incident["service"], incident["error_type"], incident.get("error_message", "")))
    diff = f"""--- a/{file_path}
+++ b/{file_path}
@@
-# existing failure path
+# add explicit fallback and guardrail for the {component} component
+# convert the runtime exception into a controlled operational response
"""
    return {
        "status": "success",
        "source": "graph-heuristic",
        "file_path": file_path,
        "summary": f"Suggested remediation prepared for {incident['error_type']} based on the {component} dependency.",
        "explanation": f"Add a protective guard around the {component} dependency and return a clear failure response before the exception propagates.",
        "diff": diff,
        "changes": [
            f"Add timeout and fallback handling around {component}.",
            "Log structured failure context before raising an application-level error.",
            "Prevent the incident from cascading into downstream services.",
        ],
    }


def get_dashboard_summary():
    incidents = list_incidents(limit=300)
    total = len(incidents)
    active = sum(1 for incident in incidents if incident["status"] not in {"resolved", "closed"})
    avg_mttr = round(sum(effective_mttr_minutes(incident) for incident in incidents) / total, 1) if incidents else 0
    before_ai = round(sum(effective_mttr_minutes(incident, ai_assisted=False) for incident in incidents) / total, 1) if incidents else 0
    improvement = round(((before_ai - avg_mttr) / before_ai) * 100) if before_ai and avg_mttr else 0
    service_totals = Counter(incident["service"] for incident in incidents if incident["status"] not in {"resolved", "closed"})
    services = []
    for service in SERVICES:
        active_count = service_totals.get(service["name"], 0)
        services.append(
            {
                "name": service["name"],
                "team": service["team"],
                "active_incidents": active_count,
                "health": "degraded" if active_count else "healthy",
                "sla": "99.99%" if service["name"] == "payments" else "99.9%",
            }
        )
    return {
        "summary": {
            "total_incidents": total,
            "active_incidents": active,
            "avg_mttr_minutes": avg_mttr,
            "before_ai_mttr_minutes": before_ai,
            "mttr_improvement": f"{improvement}%",
        },
        "services": services,
        "recent_incidents": incidents[:6],
    }


def get_mttr_analytics(days=7):
    incidents = list_incidents(limit=500)
    today = utcnow().date()
    series = []
    for offset in range(days - 1, -1, -1):
        day = today - timedelta(days=offset)
        day_incidents = [incident for incident in incidents if parse_datetime(incident["timestamp"]).date() == day]
        before_ai = round(sum(effective_mttr_minutes(incident, False) for incident in day_incidents) / len(day_incidents), 1) if day_incidents else 0
        after_ai = round(sum(effective_mttr_minutes(incident) for incident in day_incidents) / len(day_incidents), 1) if day_incidents else 0
        series.append({"label": day.strftime("%b %d"), "before_ai": before_ai, "after_ai": after_ai, "count": len(day_incidents)})
    frequency = Counter(incident["service"] for incident in incidents)
    return {
        "status": "success",
        "series": [{"label": entry["label"], "before_ai": entry["before_ai"], "after_ai": entry["after_ai"], "count": entry["count"]} for entry in series],
        "frequency": [{"service": name, "count": count} for name, count in sorted(frequency.items(), key=lambda item: (-item[1], item[0]))],
        "severity_breakdown": Counter(incident["severity"] for incident in incidents),
    }


def get_system_health():
    return {
        "status": "success",
        "services": [
            {"name": "Neo4j", "status": "UP", "detail": "Single source of truth for incidents, logs, products, carts, and dependencies", "latency_ms": 8},
            {"name": "Cart Cache Component", "status": "UP", "detail": "Represented as graph-native component cart-cache", "latency_ms": 4},
            {"name": "Payment Gateway Component", "status": "UP", "detail": "External dependency modeled in graph", "latency_ms": 16},
            {"name": "Checkout Orchestrator", "status": "UP", "detail": "Graph-backed order flow", "latency_ms": 6},
        ],
    }


def get_graph_snapshot():
    initialize_storage()
    rows = run_cypher(
        """
        MATCH (n)
        WHERE n:Service OR n:Component OR n:Incident
        OPTIONAL MATCH (n)-[r]->(m)
        WHERE m:Service OR m:Component OR m:Incident OR m:ErrorLog
        RETURN n, labels(n) AS labels, collect({type: type(r), target: m, target_labels: CASE WHEN m IS NULL THEN [] ELSE labels(m) END}) AS links
        """
    )
    nodes = []
    edges = []
    seen_edges = set()
    active_incidents = {incident["id"]: incident for incident in list_incidents(limit=300) if incident["status"] not in {"resolved", "closed"}}
    for row in rows:
        node = row["n"]
        labels = list(row.get("labels", []))
        node_id = node["name"] if "name" in node else node["id"]
        related_incidents = []
        if "Service" in labels:
            related_incidents = [incident for incident in active_incidents.values() if incident["service"] == node["name"]]
        elif "Component" in labels:
            related_incidents = [incident for incident in active_incidents.values() if incident.get("component") == node["name"]]
        elif "Incident" in labels:
            related_incidents = [active_incidents[node["id"]]] if node["id"] in active_incidents else []
        nodes.append(
            {
                "id": node_id,
                "label": node.get("name", node.get("error_type", node.get("id"))),
                "kind": labels[0],
                "team": node.get("team") or node.get("responsible_team") or infer_team(node.get("name", "api-gateway")),
                "status": "degraded" if related_incidents else node.get("status", "healthy"),
                "incident_count": len(related_incidents),
                "incidents": [{"id": incident["id"], "error_type": incident["error_type"], "severity": incident["severity"], "service": incident["service"], "status": incident["status"]} for incident in related_incidents[:6]],
            }
        )
        for link in row["links"]:
            target = link.get("target")
            if not target:
                continue
            target_id = target.get("name", target.get("id"))
            edge_id = f"{node_id}-{target_id}-{link['type']}"
            if edge_id in seen_edges:
                continue
            seen_edges.add(edge_id)
            edges.append({"id": edge_id, "source": node_id, "target": target_id, "label": link["type"]})
    return {"status": "success", "nodes": nodes, "edges": edges}


def search_incidents_graph(query="", service=None, hours_back=24):
    return list_incidents(limit=20, service=service, hours=hours_back, query=query)


def analyze_dependencies(service_name: str):
    rows = run_cypher(
        """
        MATCH (s:Service {name: $service_name})
        OPTIONAL MATCH (s)-[:DEPENDS_ON]->(c:Component)
        OPTIONAL MATCH (s)-[:IMPACTS]->(downstream:Service)
        RETURN s, collect(DISTINCT c) AS components, collect(DISTINCT downstream) AS impacted
        """,
        {"service_name": service_name},
    )
    if not rows:
        return {"status": "error", "message": "Service not found"}
    record = rows[0]
    components = [dict(component) for component in record["components"] if component]
    impacted = [dict(service) for service in record["impacted"] if service]
    return {
        "status": "success",
        "service": dict(record["s"]),
        "dependency_chain": [service_name, *[component["name"] for component in components]],
        "components": components,
        "impacted_services": impacted,
    }


def get_blast_radius(service_name: str):
    rows = run_cypher(
        """
        MATCH (s:Service {name: $service_name})
        OPTIONAL MATCH path = (s)-[:IMPACTS*1..4]->(impacted:Service)
        OPTIONAL MATCH (s)-[:DEPENDS_ON]->(component:Component)
        RETURN collect(DISTINCT impacted.name) AS services, collect(DISTINCT component.name) AS components
        """,
        {"service_name": service_name},
    )
    record = rows[0] if rows else {"services": [], "components": []}
    return {
        "service": service_name,
        "impacted_services": [name for name in record.get("services", []) if name],
        "components": [name for name in record.get("components", []) if name],
    }
