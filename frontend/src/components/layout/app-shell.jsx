import { Activity, AlertTriangle, LayoutDashboard, Radar, Route, TerminalSquare } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

const navItems = [
  { to: "/ops", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ops/incidents", label: "Incident Explorer", icon: AlertTriangle },
  { to: "/ops/graph", label: "Graph Analysis", icon: Route },
  { to: "/ops/monitoring", label: "Live Monitoring", icon: Radar },
];

export function AppShell({ connectionStatus, children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(84,211,194,0.15),transparent_30%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_25%),linear-gradient(180deg,#050914_0%,#04070e_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 md:px-6">
        <aside className="hidden w-72 shrink-0 flex-col justify-between rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,17,31,0.95),rgba(6,10,20,0.98))] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.45)] lg:flex">
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]/30">
                  <Activity className="text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">AI DevOps</p>
                  <h1 className="font-display text-2xl font-semibold">Control Plane</h1>
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-400">
                Production operations, incident response, and assisted remediation in one console.
              </p>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/ops"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-300 transition-all hover:bg-white/5 hover:text-white",
                      isActive && "bg-white/8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
                    )
                  }
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-200">
              <TerminalSquare size={16} className="text-[var(--accent)]" />
              Stream Health
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">WebSocket</span>
              <Badge variant={connectionStatus === "connected" ? "success" : "warning"}>
                {connectionStatus}
              </Badge>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Incident events, alerts, and live logs are synchronized through the realtime stream.
            </p>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-6">{children}</main>
      </div>
    </div>
  );
}
