const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const WS_BASE = (import.meta.env.VITE_WS_URL ?? "ws://localhost:8000").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.detail || payload.message || payload.error || "Request failed");
    error.payload = payload;
    throw error;
  }
  return payload;
}

export const api = {
  baseUrl: API_BASE,
  wsUrl: `${WS_BASE}/ws/incidents`,
  getSummary: () => request("/api/platform/summary"),
  getStoreProducts: () => request("/products"),
  getStoreProduct: (productId) => request(`/products/${productId}`),
  getStoreCart: (sessionId) => request(`/cart/${sessionId}`),
  addStoreCartItem: (body) =>
    request("/cart", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  checkoutStoreCart: (body) =>
    request("/checkout", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  payStoreCart: (body) =>
    request("/payment", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getIncidents: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "" && value !== "all") {
        query.set(key, value);
      }
    });
    const suffix = query.toString() ? `?${query}` : "";
    return request(`/api/platform/incidents${suffix}`);
  },
  getIncident: (incidentId) => request(`/api/platform/incidents/${incidentId}`),
  updateIncident: (incidentId, body) =>
    request(`/api/platform/incidents/${incidentId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  getAnalytics: () => request("/api/platform/analytics/mttr"),
  getHealth: () => request("/api/platform/health"),
  getGraph: () => request("/api/platform/graph"),
  getLogs: () => request("/api/platform/logs/recent"),
  simulate: async (scenario) => {
    const response = await fetch(`${API_BASE}/api/platform/simulate/${scenario}`, { method: "POST" });
    const payload = await response.json().catch(() => ({}));
    return { ok: response.ok, ...payload };
  },
  runRca: (incidentId) => request(`/api/ai/rca/${incidentId}`, { method: "POST" }),
  generateFix: (incidentId, filePath) =>
    request(`/api/ai/fix/${incidentId}`, {
      method: "POST",
      body: JSON.stringify({ file_path: filePath }),
    }),
  applyFix: (incidentId, filePath, approved) =>
    request(`/api/ai/apply_fix/${incidentId}`, {
      method: "POST",
      body: JSON.stringify({ file_path: filePath, approved }),
    }),
};
