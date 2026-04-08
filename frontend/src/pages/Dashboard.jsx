import { startTransition, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Clock3,
  Flame,
  GitBranchPlus,
  HeartPulse,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { api } from "../lib/api";
import { formatTimestamp, severityTone, titleCase } from "../lib/formatters";

function MetricCard({ icon, label, value, helper, accent = "text-[var(--accent)]" }) {
  const Icon = icon;
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start justify-between p-6">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-3 text-4xl font-semibold text-white">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{helper}</p>
        </div>
        <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <Icon className={accent} size={22} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState({ series: [], frequency: [] });
  const [health, setHealth] = useState([]);
  const [simulation, setSimulation] = useState("");

  useEffect(() => {
    Promise.all([api.getSummary(), api.getAnalytics(), api.getHealth()])
      .then(([summaryPayload, analyticsPayload, healthPayload]) => {
        startTransition(() => {
          setSummary(summaryPayload);
          setAnalytics(analyticsPayload);
          setHealth(healthPayload.services ?? []);
        });
      })
      .catch(() => {});
  }, []);

  async function triggerSimulation(scenario) {
    setSimulation(scenario);
    try {
      await api.simulate(scenario);
    } finally {
      setSimulation("");
    }
  }

  const metrics = summary?.summary ?? {
    total_incidents: 0,
    active_incidents: 0,
    avg_mttr_minutes: 0,
    mttr_improvement: "0%",
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <CardContent className="relative p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(84,211,194,0.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_35%)]" />
            <div className="relative space-y-5">
              <Badge variant="accent">AI-Assisted Operations</Badge>
              <div className="max-w-3xl space-y-3">
                <h2 className="font-display text-4xl font-semibold leading-tight text-white">
                  Production-grade observability, incident response, and auto-remediation in one dashboard.
                </h2>
                <p className="max-w-2xl text-base leading-7 text-slate-300">
                  Track system health, inspect blast radius through the dependency graph, and move from detection to PR approval without leaving the console.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/ops/incidents">
                    Investigate Incidents
                    <ArrowUpRight size={16} />
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link to="/ops/monitoring">
                    Watch Live Logs
                    <Activity size={16} />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health Panel</CardTitle>
            <CardDescription>Live reachability checks for core platform services.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {health.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
              >
                <div>
                  <p className="text-sm text-white">{service.name}</p>
                  <p className="text-xs text-slate-500">{service.detail}</p>
                </div>
                <div className="text-right">
                  <Badge variant={service.status === "UP" ? "success" : "critical"}>{service.status}</Badge>
                  <p className="mt-2 text-xs text-slate-500">
                    {service.latency_ms ? `${service.latency_ms} ms` : "No latency sample"}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={AlertTriangle}
          label="Total Incidents"
          value={metrics.total_incidents}
          helper="Platform-wide incidents tracked in the Neo4j knowledge graph"
          accent="text-red-300"
        />
        <MetricCard
          icon={Flame}
          label="Active Incidents"
          value={metrics.active_incidents}
          helper="Currently open, investigating, or mitigating"
          accent="text-amber-200"
        />
        <MetricCard
          icon={Clock3}
          label="Average MTTR"
          value={`${metrics.avg_mttr_minutes}m`}
          helper="Mean time to recovery after AI assistance"
        />
        <MetricCard
          icon={Sparkles}
          label="MTTR Improvement"
          value={metrics.mttr_improvement}
          helper="Estimated reduction versus manual-only workflow"
          accent="text-emerald-200"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>MTTR Before AI vs After AI</CardTitle>
            <CardDescription>Daily trendline for assisted incident resolution.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.series}>
                <defs>
                  <linearGradient id="beforeAi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="afterAi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#54d3c2" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#54d3c2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09111f",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 18,
                    color: "#fff",
                  }}
                />
                <Area type="monotone" dataKey="before_ai" stroke="#fb7185" fill="url(#beforeAi)" strokeWidth={2} />
                <Area type="monotone" dataKey="after_ai" stroke="#54d3c2" fill="url(#afterAi)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incident Frequency By Service</CardTitle>
            <CardDescription>Which services are generating the most operational churn.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.frequency}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="service" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09111f",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 18,
                    color: "#fff",
                  }}
                />
                <Bar dataKey="count" fill="#fbbf24" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Incident Lifecycle</CardTitle>
            <CardDescription>Click through to full logs, RCA, suggested fix, and PR workflow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(summary?.recent_incidents ?? []).map((incident) => (
              <Link
                key={incident.id}
                to={`/ops/incidents/${incident.id}`}
                className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 transition hover:border-white/15 hover:bg-white/[0.05]"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="rounded-2xl bg-white/5 p-3">
                    <ShieldCheck size={18} className="text-[var(--accent)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{incident.error_type}</p>
                    <p className="mt-1 truncate text-sm text-slate-400">
                      {incident.service} on {incident.endpoint}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={severityTone(incident.severity)}>{incident.severity}</Badge>
                  <p className="mt-2 text-xs text-slate-500">{formatTimestamp(incident.timestamp)}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demo Mode</CardTitle>
            <CardDescription>Trigger a live incident and watch the platform respond in realtime.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "db-crash", label: "DB Crash", helper: "Orders service hits a Neo4j transaction failure" },
              { key: "redis-oom", label: "Redis OOM", helper: "Cart cache exceeds safe memory threshold" },
              { key: "api-timeout", label: "API Timeout", helper: "Payments service hangs on upstream dependency" },
              { key: "search-index", label: "Search Index", helper: "Search service queries an invalid graph field" },
              { key: "inventory-oversell", label: "Inventory Oversell", helper: "Inventory reservation fails under conflicting demand" },
            ].map((scenario) => (
              <button
                key={scenario.key}
                type="button"
                onClick={() => triggerSimulation(scenario.key)}
                className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-[var(--accent)]/40 hover:bg-white/[0.05]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{scenario.label}</p>
                    <p className="mt-1 text-sm text-slate-400">{scenario.helper}</p>
                  </div>
                  <Badge variant={simulation === scenario.key ? "warning" : "muted"}>
                    {simulation === scenario.key ? "Running" : "Ready"}
                  </Badge>
                </div>
              </button>
            ))}

            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <GitBranchPlus size={18} className="text-[var(--accent)]" />
                <div>
                  <p className="text-sm text-white">Auto-fix workflow enabled</p>
                  <p className="text-xs text-slate-500">
                    Generated fixes can be reviewed and approved from the incident detail page.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <HeartPulse size={18} className="text-emerald-200" />
                <div>
                  <p className="text-sm text-white">Real-time observability</p>
                  <p className="text-xs text-slate-500">
                    Incident alerts, logs, and graph health update automatically through WebSocket events.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(summary?.services ?? []).map((service) => (
          <Card key={service.name}>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{service.team}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{titleCase(service.name)}</h3>
                </div>
                <Badge variant={service.health === "healthy" ? "success" : "warning"}>{service.health}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/[0.03] p-3">
                  <p className="text-slate-500">Active</p>
                  <p className="mt-1 text-xl font-semibold text-white">{service.active_incidents}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.03] p-3">
                  <p className="text-slate-500">SLA</p>
                  <p className="mt-1 text-xl font-semibold text-white">{service.sla}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
