import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";

import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { api } from "../lib/api";
import { formatTimestamp, severityTone, statusTone, titleCase } from "../lib/formatters";

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [filters, setFilters] = useState({
    severity: "all",
    service: "all",
    time: "168",
    query: "",
  });

  const deferredQuery = useDeferredValue(filters.query);

  useEffect(() => {
    api
      .getIncidents({
        hours: filters.time,
      })
      .then((payload) => setIncidents(payload.incidents ?? []))
      .catch(() => setIncidents([]));
  }, [filters.time]);

  const services = useMemo(
    () => ["all", ...new Set(incidents.map((incident) => incident.service))],
    [incidents],
  );

  const filtered = useMemo(
    () =>
      incidents.filter((incident) => {
        const matchesSeverity =
          filters.severity === "all" || incident.severity?.toLowerCase() === filters.severity;
        const matchesService = filters.service === "all" || incident.service === filters.service;
        const haystack = `${incident.error_type} ${incident.endpoint} ${incident.error_message ?? ""}`.toLowerCase();
        const matchesQuery = !deferredQuery || haystack.includes(deferredQuery.toLowerCase());
        return matchesSeverity && matchesService && matchesQuery;
      }),
    [deferredQuery, filters.service, filters.severity, incidents],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Incident Explorer</CardTitle>
          <CardDescription>
            Filter by severity, service, or time window to inspect incidents across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <Input
              className="pl-9"
              placeholder="Search error type, endpoint, or log detail"
              value={filters.query}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  query: event.target.value,
                }))
              }
            />
          </div>
          <Select
            value={filters.severity}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                severity: event.target.value,
              }))
            }
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Select
            value={filters.service}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                service: event.target.value,
              }))
            }
          >
            {services.map((service) => (
              <option key={service} value={service}>
                {service === "all" ? "All Services" : titleCase(service)}
              </option>
            ))}
          </Select>
          <Select
            value={filters.time}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                time: event.target.value,
              }))
            }
          >
            <option value="24">Last 24 Hours</option>
            <option value="72">Last 3 Days</option>
            <option value="168">Last 7 Days</option>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Incidents</CardTitle>
          <CardDescription>{filtered.length} incidents match the current filters.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr className="border-b border-white/8">
                  <th className="pb-4 font-medium">Severity</th>
                  <th className="pb-4 font-medium">Status</th>
                  <th className="pb-4 font-medium">Incident</th>
                  <th className="pb-4 font-medium">Service</th>
                  <th className="pb-4 font-medium">Endpoint</th>
                  <th className="pb-4 font-medium">Detected</th>
                  <th className="pb-4 font-medium text-right">Open</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((incident) => (
                  <tr key={incident.id} className="border-b border-white/6 last:border-0">
                    <td className="py-4">
                      <Badge variant={severityTone(incident.severity)}>{incident.severity}</Badge>
                    </td>
                    <td className="py-4">
                      <Badge variant={statusTone(incident.status)}>{incident.status}</Badge>
                    </td>
                    <td className="py-4">
                      <div>
                        <p className="font-medium text-white">{incident.error_type}</p>
                        <p className="mt-1 max-w-md text-xs text-slate-500">
                          {incident.error_message || incident.summary}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 text-slate-300">{titleCase(incident.service)}</td>
                    <td className="py-4 font-mono text-xs text-slate-400">{incident.endpoint}</td>
                    <td className="py-4 text-slate-400">{formatTimestamp(incident.timestamp)}</td>
                    <td className="py-4 text-right">
                      <Link
                        className="inline-flex items-center gap-2 text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                        to={`/ops/incidents/${incident.id}`}
                      >
                        View
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
