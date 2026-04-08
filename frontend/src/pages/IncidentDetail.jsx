import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  ExternalLink,
  FileCode2,
  GitPullRequestArrow,
  Layers3,
  Loader2,
  PencilLine,
  ScrollText,
} from "lucide-react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { api } from "../lib/api";
import {
  formatLongTimestamp,
  formatTimestamp,
  severityTone,
  statusTone,
  titleCase,
} from "../lib/formatters";

function DiffViewer({ diff }) {
  if (!diff) {
    return <p className="text-sm text-slate-500">No diff has been generated for this incident yet.</p>;
  }

  return (
    <pre className="overflow-x-auto rounded-3xl border border-white/8 bg-[#07111f] p-4 text-xs leading-6 text-slate-200">
      {diff.split("\n").map((line, index) => {
        const tone =
          line.startsWith("+")
            ? "bg-emerald-500/10 text-emerald-200"
            : line.startsWith("-")
              ? "bg-red-500/10 text-red-200"
              : "text-slate-300";
        return (
          <span key={`${line}-${index}`} className={`block rounded px-2 ${tone}`}>
            {line || " "}
          </span>
        );
      })}
    </pre>
  );
}

export default function IncidentDetail() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [status, setStatus] = useState("investigating");
  const [assignee, setAssignee] = useState("");
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [working, setWorking] = useState({ rca: false, fix: false, approval: false, update: false });
  const [error, setError] = useState("");

  const refreshIncident = useCallback(() => {
    if (!id) return Promise.resolve();
    return api
      .getIncident(id)
      .then((payload) => {
        const nextIncident = payload.incident;
        setIncident(nextIncident);
        setStatus(nextIncident.status ?? "investigating");
        setAssignee(nextIncident.assignee ?? "");
      })
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    refreshIncident();
  }, [refreshIncident]);

  const rca = incident?.rca_payload ?? {};
  const fix = incident?.fix_payload ?? {};

  const filePath = useMemo(
    () => incident?.fix_file_path || fix.file_path || rca.related_file || "app/routers/payments.py",
    [fix.file_path, incident?.fix_file_path, rca.related_file],
  );
  const [fileOverride, setFileOverride] = useState(filePath);
  useEffect(() => {
    setFileOverride(filePath);
  }, [filePath]);

  async function runRca() {
    setWorking((current) => ({ ...current, rca: true }));
    setError("");
    try {
      await api.runRca(id);
      await refreshIncident();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking((current) => ({ ...current, rca: false }));
    }
  }

  async function generateFix() {
    setWorking((current) => ({ ...current, fix: true }));
    setError("");
    try {
      await api.generateFix(id, fileOverride);
      await refreshIncident();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking((current) => ({ ...current, fix: false }));
    }
  }

  async function decideFix(approved) {
    setWorking((current) => ({ ...current, approval: true }));
    setError("");
    try {
      await api.applyFix(id, fileOverride, approved);
      await refreshIncident();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking((current) => ({ ...current, approval: false }));
    }
  }

  async function updateLifecycle() {
    setWorking((current) => ({ ...current, update: true }));
    setError("");
    try {
      await api.updateIncident(id, {
        status,
        assignee,
        resolution_summary: resolutionSummary,
      });
      setResolutionSummary("");
      await refreshIncident();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking((current) => ({ ...current, update: false }));
    }
  }

  if (!incident) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-8 text-slate-400">
          <Loader2 className="animate-spin" size={18} />
          Loading incident context...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link className="inline-flex items-center gap-2 transition hover:text-white" to="/ops/incidents">
          <ArrowLeft size={16} />
          Incident Explorer
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-300">{incident.id.slice(0, 8)}</span>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-8 xl:grid-cols-[1.5fr_0.7fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={severityTone(incident.severity)}>{incident.severity}</Badge>
              <Badge variant={statusTone(incident.status)}>{incident.status}</Badge>
              <Badge variant="muted">{titleCase(incident.service)}</Badge>
            </div>
            <div>
              <h2 className="font-display text-3xl font-semibold text-white">{incident.error_type}</h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
                {incident.error_message || incident.summary}
              </p>
            </div>
            <div className="grid gap-4 text-sm text-slate-400 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Detected</p>
                <p className="mt-2 text-white">{formatLongTimestamp(incident.timestamp)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Endpoint</p>
                <p className="mt-2 font-mono text-white">{incident.endpoint}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Responsible Team</p>
                <p className="mt-2 text-white">{incident.responsible_team || incident.team}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Incident Lifecycle</p>
            <div className="mt-4 space-y-3">
              <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="mitigating">Mitigating</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </Select>
              <Input value={assignee} onChange={(event) => setAssignee(event.target.value)} placeholder="Assign owner or team" />
              <Textarea
                placeholder="Add a lifecycle note or resolution summary"
                value={resolutionSummary}
                onChange={(event) => setResolutionSummary(event.target.value)}
              />
              <Button className="w-full" onClick={updateLifecycle} disabled={working.update}>
                {working.update ? <Loader2 size={16} className="animate-spin" /> : <PencilLine size={16} />}
                Update Incident
              </Button>
              {incident.pr_url ? (
                <a
                  href={incident.pr_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                >
                  View Pull Request
                  <ExternalLink size={14} />
                </a>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-red-400/20">
          <CardContent className="p-4 text-sm text-red-200">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit size={18} className="text-[var(--accent)]" />
              AI RCA Panel
            </CardTitle>
            <CardDescription>
              Root cause, affected services, dependency chain, and transparent reasoning.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-3">
              <Button onClick={runRca} disabled={working.rca}>
                {working.rca ? <Loader2 className="animate-spin" size={16} /> : <BrainCircuit size={16} />}
                Run Root Cause Analysis
              </Button>
              <Badge variant={severityTone(rca.risk_level || incident.severity)}>
                risk: {rca.risk_level || incident.severity}
              </Badge>
              <Badge variant="muted">{rca.source || "pending"}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Root Cause</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  {rca.root_cause || "No analysis stored yet. Run RCA to populate this panel."}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Fix Recommendation</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  {rca.fix_recommendation || incident.suggested_fix || "Awaiting recommendation."}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Affected Services</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(rca.affected_services || incident.affected_services || []).map((service) => (
                    <Badge key={service} variant="accent">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Dependency Chain</p>
                <p className="mt-3 text-sm text-slate-200">
                  {(rca.dependency_chain || incident.dependency_chain || []).join(" -> ") || "No chain available"}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Estimated Recovery</p>
                <p className="mt-3 text-sm text-slate-200">{rca.estimated_recovery_time || "Pending analysis"}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Explain How You Found This</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                {rca.explanation || incident.explanation || "The RCA engine has not produced a traceable explanation yet."}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                {(rca.evidence || []).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers3 size={18} className="text-[var(--accent)]" />
              Investigation Timeline
            </CardTitle>
            <CardDescription>Every lifecycle, RCA, and approval event for this incident.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(incident.events ?? []).map((event) => (
              <div key={`${event.timestamp}-${event.title}`} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{event.title}</p>
                  <p className="text-xs text-slate-500">{formatTimestamp(event.timestamp)}</p>
                </div>
                <p className="mt-2 text-sm text-slate-300">{event.details}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{event.actor}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitPullRequestArrow size={18} className="text-[var(--accent)]" />
              GitHub Fix Workflow
            </CardTitle>
            <CardDescription>Generate a patch, review the diff, and approve or reject the remediation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <Input value={fileOverride} onChange={(event) => setFileOverride(event.target.value)} />
              <Button onClick={generateFix} disabled={working.fix}>
                {working.fix ? <Loader2 className="animate-spin" size={16} /> : <FileCode2 size={16} />}
                Generate Fix
              </Button>
            </div>

            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Suggested Change Summary</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                {fix.explanation || "Generate a fix to see the recommended code change and rationale."}
              </p>
            </div>

            <DiffViewer diff={fix.diff || incident.fix_diff} />

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => decideFix(false)} disabled={working.approval}>
                Reject Fix
              </Button>
              <Button variant="success" onClick={() => decideFix(true)} disabled={working.approval}>
                {working.approval ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                Approve Fix
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText size={18} className="text-[var(--accent)]" />
              Full Error Log
            </CardTitle>
            <CardDescription>Raw stack trace and captured incident metadata from the logger.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Metadata</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Incident ID</dt>
                  <dd className="font-mono text-slate-200">{incident.id}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Detected By</dt>
                  <dd className="text-slate-200">{incident.detected_by || "middleware"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Active Duration</dt>
                  <dd className="text-slate-200">{incident.active_duration_minutes} minutes</dd>
                </div>
              </dl>
            </div>
            <pre className="max-h-[520px] overflow-auto rounded-3xl border border-white/8 bg-[#07111f] p-4 text-xs leading-6 text-slate-200">
              {incident.stack_trace || incident.error_message || "No stack trace available"}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
