import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/layout/app-shell";
import { LiveAlert } from "./components/layout/live-alert";
import { StorefrontShell } from "./components/storefront/storefront-shell";
import { useIncidentStream } from "./hooks/useIncidentStream";
import Dashboard from "./pages/Dashboard";
import DependencyGraph from "./pages/DependencyGraph";
import IncidentDetail from "./pages/IncidentDetail";
import Incidents from "./pages/Incidents";
import LiveMonitoring from "./pages/LiveMonitoring";
import CartPage from "./pages/storefront/CartPage";
import CheckoutPage from "./pages/storefront/CheckoutPage";
import HomePage from "./pages/storefront/HomePage";
import ProductPage from "./pages/storefront/ProductPage";
import { StoreProvider } from "./storefront/store-context";

function OpsConsole() {
  const { status, latestIncident, clearLatestIncident } = useIncidentStream();

  return (
    <AppShell connectionStatus={status}>
      <LiveAlert incident={latestIncident} onDismiss={clearLatestIncident} />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/incidents/:id" element={<IncidentDetail />} />
        <Route path="/graph" element={<DependencyGraph />} />
        <Route path="/monitoring" element={<LiveMonitoring />} />
      </Routes>
    </AppShell>
  );
}

function Storefront() {
  return (
    <StoreProvider>
      <StorefrontShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Routes>
      </StorefrontShell>
    </StoreProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/ops/*" element={<OpsConsole />} />
        <Route path="/*" element={<Storefront />} />
      </Routes>
    </BrowserRouter>
  );
}
