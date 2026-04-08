import { useEffect, useMemo, useState } from "react";
import { ActivitySquare, RadioTower, RefreshCcw } from "lucide-react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useIncidentStream } from "../hooks/useIncidentStream";
import { api } from "../lib/api";
import { formatTimestamp, severityTone, statusTone } from "../lib/formatters";

export default function LiveMonitoring() {
  const [baseLogs, setBaseLogs] = useState([]);
  const { status, events } = useIncidentStream();

  const loadLogs = () => {
    api
      .getLogs()
      .then((payload) => setBaseLogs(payload.logs ?? []))
      .catch(() => setBaseLogs([]));
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const logs = useMemo(() => {
    const incidentEvents = events
      .filter((event) => event.type === "NEW_INCIDENT" && event.incident)
      .map((event) => ({
        id: event.incident.id,
        timestamp: event.incident.timestamp,
        service: event.incident.service,
        severity: event.incident.severity,
        status: event.incident.status,
        endpoint: event.incident.endpoint,
        error_type: event.incident.error_type,
        message: event.incident.error_message ?? event.incident.summary,
        stack_trace: event.incident.stack_trace ?? "",
      }));

    const merged = [...incidentEvents, ...baseLogs];
    return Array.from(new Map(merged.map((entry) => [entry.id, entry])).values()).slice(0, 80);
  }, [baseLogs, events]);

  const criticalCount = useMemo(
    () => logs.filter((log) => (log.severity ?? "").toLowerCase() === "critical").length,
    [logs],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="accent">Live Monitoring</Badge>
              <Badge variant={status === "connected" ? "success" : "warning"}>{status}</Badge>
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold text-white">Realtime Incident Pipeline</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
              Incoming incidents stream from the backend over WebSocket and are merged with the recent log history so reviewers can watch failures as they happen.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
              <p className="text-slate-500">Critical Events</p>
              <p className="mt-1 text-xl font-semibold text-white">{criticalCount}</p>
            </div>
            <Button variant="secondary" onClick={loadLogs}>
              <RefreshCcw size={16} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RadioTower size={18} className="text-[var(--accent)]" />
            Realtime Log Stream
          </CardTitle>
          <CardDescription>
            Errors, service metadata, and captured stack traces update in-place as the stream receives events.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="rounded-3xl border border-white/8 bg-[#07111f] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/5 p-3">
                    <ActivitySquare size={18} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{log.error_type}</p>
                    <p className="text-sm text-slate-400">
                      {log.service} on <span className="font-mono">{log.endpoint}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 lg:ml-auto">
                  <Badge variant={severityTone(log.severity)}>{log.severity}</Badge>
                  <Badge variant={statusTone(log.status)}>{log.status}</Badge>
                  <Badge variant="muted">{formatTimestamp(log.timestamp)}</Badge>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">{log.message}</p>
              {log.stack_trace ? (
                <details className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <summary className="cursor-pointer text-sm text-slate-300">View stack trace</summary>
                  <pre className="mt-4 overflow-x-auto text-xs leading-6 text-slate-400">{log.stack_trace}</pre>
                </details>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
