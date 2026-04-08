import os
import sqlite3

from app.services.graph_service import initialize_graph
from app.services.incident_service import infer_service, record_incident


def migrate_sqlite_incidents(sqlite_path: str):
    if not os.path.exists(sqlite_path):
        print(f"SQLite incident store not found at {sqlite_path}; skipping incident import.")
        return

    with sqlite3.connect(sqlite_path) as conn:
        rows = conn.execute(
            """
            SELECT id, timestamp, service, endpoint, error_type, stack_trace, error_message, severity
            FROM incidents
            ORDER BY timestamp ASC
            """
        ).fetchall()

    for row in rows:
        incident_id, timestamp, service, endpoint, error_type, stack_trace, error_message, severity = row
        record_incident(
            incident_id=incident_id,
            timestamp=timestamp,
            service=service or infer_service(endpoint or "/"),
            endpoint=endpoint or "/legacy",
            error_type=error_type or "LegacyIncident",
            error_message=error_message or "",
            stack_trace=stack_trace or "",
            severity=severity or None,
            source="migration",
            detected_by="migration-script",
        )

    print(f"Migrated {len(rows)} incident rows from SQLite into Neo4j.")


def main():
    initialize_graph()
    sqlite_path = os.environ.get("INCIDENT_DB_PATH", "./incidents.db")
    migrate_sqlite_incidents(sqlite_path)
    print("Neo4j is now ready to act as the single source of truth.")


if __name__ == "__main__":
    main()
