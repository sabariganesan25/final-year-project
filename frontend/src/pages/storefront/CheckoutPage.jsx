import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { useStore } from "../../storefront/use-store";

export default function CheckoutPage() {
  const { cart, checkout, initializing, lastOrder, loading, notice, resetDemo } = useStore();
  const [form, setForm] = useState({
    customer_name: "Alice Kumar",
    email: "alice@example.com",
    address: "221B Innovation Park, Bengaluru",
    user_id: "u1",
  });

  async function handleCheckout() {
    try {
      await checkout(form);
    } catch {
      // Notice banner and local state already capture the error path.
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Checkout</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-slate-900">Place the order and watch what happens</h1>
        </div>
        <Button type="button" variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50" onClick={resetDemo}>
          Reset Test
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
            <p className="text-lg font-semibold text-slate-900">Customer details</p>
            <div className="mt-5 grid gap-4">
              <Input
                className="border-slate-200 bg-white text-slate-900"
                value={form.customer_name}
                onChange={(event) => setForm((current) => ({ ...current, customer_name: event.target.value }))}
                placeholder="Customer name"
              />
              <Input
                className="border-slate-200 bg-white text-slate-900"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="Email address"
              />
              <Textarea
                className="border-slate-200 bg-white text-slate-900"
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                placeholder="Shipping address"
              />
            </div>
          </div>

          {lastOrder ? (
            <div className="rounded-[32px] border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
              <p className="text-lg font-semibold">Order placed successfully</p>
              <p className="mt-2 text-sm">Order ID: <span className="font-mono">{lastOrder.order_id}</span></p>
              <p className="mt-2 text-sm">Payment transaction: <span className="font-mono">{lastOrder.payment?.transaction_id}</span></p>
              <div className="mt-4 flex gap-3">
                <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
                  <Link to="/">Continue Shopping</Link>
                </Button>
                <Button type="button" variant="outline" className="border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-100" onClick={resetDemo}>
                  Test Again
                </Button>
              </div>
            </div>
          ) : null}

          {notice?.type === "error" ? (
            <div className="rounded-[32px] border border-red-200 bg-red-50 p-6 text-red-800">
              <p className="text-lg font-semibold">Checkout did not complete</p>
              <p className="mt-2 text-sm">{notice.message}</p>
              {notice.incidentId ? (
                <p className="mt-2 text-sm">
                  Incident ID: <span className="font-mono">{notice.incidentId}</span>
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3">
                <Button asChild className="bg-red-600 text-white hover:bg-red-700">
                  <Link to="/ops">Open Ops Console</Link>
                </Button>
                <Button type="button" variant="outline" className="border-red-300 bg-white text-red-700 hover:bg-red-100" onClick={resetDemo}>
                  Start New Test
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
          <p className="text-lg font-semibold text-slate-900">Order summary</p>
          <div className="mt-5 space-y-3">
            {cart.items.length === 0 && !initializing ? (
              <p className="text-sm text-slate-500">Cart is empty. Add a product first.</p>
            ) : null}
            {cart.items.map((item) => (
              <div key={item.product_id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-slate-500">Qty {item.quantity}</p>
                </div>
                <p className="font-semibold text-slate-900">Rs. {(item.price * item.quantity).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Total</span>
              <span className="font-semibold text-slate-900">Rs. {cart.totals.grand_total?.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <Button
            type="button"
            className="mt-6 w-full bg-[#ff6f00] text-white hover:bg-[#f45d00]"
            onClick={handleCheckout}
            disabled={loading || cart.items.length === 0}
          >
            {loading ? "Processing..." : "Place Order"}
          </Button>

          <p className="mt-3 text-xs leading-6 text-slate-500">
            Use normal items to test the happy path. Use chaos-demo items to create incidents intentionally for ops and MCP testing.
          </p>
        </aside>
      </div>
    </div>
  );
}
