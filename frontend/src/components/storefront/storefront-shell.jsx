import { ShoppingCart, ShieldAlert, Sparkles } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { Button } from "../ui/button";
import { useStore } from "../../storefront/use-store";

export function StorefrontShell({ children }) {
  const { cart, notice, setNotice } = useStore();

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#0b57d0] p-2 text-white">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">ShopSphere</p>
              <p className="font-display text-xl font-semibold text-slate-900">E-Commerce Demo</p>
            </div>
          </Link>

          <nav className="ml-auto hidden items-center gap-5 text-sm text-slate-600 md:flex">
            <NavLink to="/" className="transition hover:text-[#0b57d0]">
              Home
            </NavLink>
            <NavLink to="/cart" className="transition hover:text-[#0b57d0]">
              Cart
            </NavLink>
            <NavLink to="/checkout" className="transition hover:text-[#0b57d0]">
              Checkout
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-3 md:ml-6">
            <Button asChild variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
              <Link to="/ops">
                <ShieldAlert size={16} />
                Ops Console
              </Link>
            </Button>
            <Button asChild className="bg-[#ffb400] text-slate-900 hover:bg-[#ffa000]">
              <Link to="/cart">
                <ShoppingCart size={16} />
                Cart ({cart.items.length})
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {notice ? (
        <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              notice.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p>{notice.message}</p>
                {notice.incidentId ? (
                  <p className="mt-1 text-xs">
                    Incident created: <span className="font-mono">{notice.incidentId}</span>. Open the Ops Console or Claude Desktop to investigate.
                  </p>
                ) : null}
              </div>
              <button type="button" onClick={() => setNotice(null)} className="text-xs font-medium">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <main>{children}</main>
    </div>
  );
}
