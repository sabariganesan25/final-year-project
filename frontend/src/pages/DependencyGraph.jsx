import { useEffect, useMemo, useRef, useState } from "react";
import cytoscape from "cytoscape";
import { Database, Network, RefreshCcw, Server, TriangleAlert } from "lucide-react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { api } from "../lib/api";
import { severityTone, titleCase } from "../lib/formatters";

function buildElements(graph) {
  const nodes = (graph.nodes ?? []).map((node) => ({
    data: {
      id: node.id,
      label: node.label,
      team: node.team,
      kind: node.kind,
      status: node.status,
      incidentCount: node.incident_count,
      incidents: node.incidents ?? [],
    },
  }));

  const edges = (graph.edges ?? []).map((edge) => ({
    data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
    },
  }));

  return [...nodes, ...edges];
}

export default function DependencyGraph() {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  const loadGraph = () =>
    api
      .getGraph()
      .then((payload) => {
        setGraph(payload);
        setSelectedNode(payload.nodes?.find((node) => node.incident_count > 0) ?? payload.nodes?.[0] ?? null);
      })
      .catch(() => setGraph({ nodes: [], edges: [] }));

  useEffect(() => {
    loadGraph();
  }, []);

  useEffect(() => {
    if (!containerRef.current || graph.nodes.length === 0) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: buildElements(graph),
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "font-size": 12,
            "font-family": "Space Grotesk",
            color: "#f8fafc",
            "text-wrap": "wrap",
            "text-max-width": 120,
            "background-color": "#1d2738",
            "border-width": 2,
            "border-color": "#54d3c2",
            "text-valign": "center",
            "text-halign": "center",
            width: 88,
            height: 88,
          },
        },
        {
          selector: 'node[kind = "Database"]',
          style: {
            shape: "round-rectangle",
            "background-color": "#1b2534",
            "border-color": "#fbbf24",
          },
        },
        {
          selector: 'node[status = "degraded"]',
          style: {
            "background-color": "#3b1018",
            "border-color": "#fb7185",
            "shadow-blur": 30,
            "shadow-color": "#fb7185",
            "shadow-opacity": 0.22,
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#334155",
            "target-arrow-color": "#334155",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            color: "#64748b",
            "font-size": 10,
            "text-background-color": "#08111d",
            "text-background-opacity": 1,
            "text-background-padding": 4,
          },
        },
        {
          selector: ":selected",
          style: {
            "border-color": "#54d3c2",
            "border-width": 4,
          },
        },
      ],
      layout: {
        name: "breadthfirst",
        directed: true,
        padding: 30,
        spacingFactor: 1.25,
      },
      minZoom: 0.6,
      maxZoom: 2.2,
    });

    cy.on("tap", "node", (event) => {
      setSelectedNode(graph.nodes.find((node) => node.id === event.target.id()) ?? null);
    });

    cy.on("mouseover", "node", (event) => {
      setHoveredNode(graph.nodes.find((node) => node.id === event.target.id()) ?? null);
    });

    cy.on("mouseout", "node", () => {
      setHoveredNode(null);
    });

    cyRef.current = cy;
    return () => cy.destroy();
  }, [graph]);

  const inspector = useMemo(() => selectedNode ?? hoveredNode, [hoveredNode, selectedNode]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="accent">Neo4j Dependency Graph</Badge>
              {hoveredNode ? <Badge variant="muted">hovering {hoveredNode.label}</Badge> : null}
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold text-white">Visual Graph Analysis</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
              Services, databases, and dependency edges are rendered from the graph backend. Failing nodes glow red and selecting a node reveals linked incidents.
            </p>
          </div>
          <Button variant="secondary" onClick={loadGraph}>
            <RefreshCcw size={16} />
            Refresh Graph
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[680px] w-full" ref={containerRef} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network size={18} className="text-[var(--accent)]" />
                Node Inspector
              </CardTitle>
              <CardDescription>Hover to preview. Click to lock a node and inspect incidents.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inspector ? (
                <>
                  <div className="flex items-center justify-between rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white/5 p-3">
                        {inspector.kind === "Database" ? (
                          <Database size={18} className="text-amber-200" />
                        ) : (
                          <Server size={18} className="text-[var(--accent)]" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{titleCase(inspector.label)}</p>
                        <p className="text-sm text-slate-400">{inspector.team || "Platform"}</p>
                      </div>
                    </div>
                    <Badge variant={inspector.status === "degraded" ? "critical" : "success"}>
                      {inspector.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Type</p>
                      <p className="mt-2 text-sm text-white">{inspector.kind}</p>
                    </div>
                    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Incident Count</p>
                      <p className="mt-2 text-sm text-white">{inspector.incident_count}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400">The graph is loading or does not contain any nodes yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TriangleAlert size={18} className="text-amber-200" />
                Incidents On Selected Node
              </CardTitle>
              <CardDescription>Clicking a node surfaces related incidents and their severity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(inspector?.incidents ?? []).length > 0 ? (
                inspector.incidents.map((incident) => (
                  <div key={incident.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white">{incident.error_type}</p>
                      <Badge variant={severityTone(incident.severity)}>{incident.severity}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{titleCase(incident.service)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No active incidents are currently attached to this node.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
