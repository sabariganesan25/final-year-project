import { BellRing } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "../ui/button";

export function LiveAlert({ incident, onDismiss }) {
  if (!incident) return null;

  return (
    <div className="rounded-3xl border border-red-400/20 bg-[linear-gradient(90deg,rgba(127,29,29,0.65),rgba(15,23,42,0.92))] p-4 shadow-[0_18px_50px_rgba(127,29,29,0.25)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-2xl bg-red-500/15 p-2 ring-1 ring-red-400/20">
            <BellRing size={18} className="text-red-200" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-red-200/80">New Incident Detected</p>
            <p className="mt-1 text-sm text-red-50">
              {incident.error_type} on <span className="font-medium text-white">{incident.service}</span> at{" "}
              <span className="font-mono text-red-100">{incident.endpoint}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2 lg:ml-auto">
          <Button asChild size="sm" variant="secondary">
            <Link to={`/ops/incidents/${incident.id}`}>Investigate</Link>
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
