import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { useStore } from "../../storefront/use-store";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, checkout, loading } = useStore();
  const [form, setForm] = useState({
    customer_name: "Alice Kumar",
    email: "alice@example.com",
    address: "221B Innovation Park, Bengaluru",
    user_id: "u1",
  });

  async function handleCheckout() {
    try {
      await checkout(form);
      navigate("/?order=success");
    } catch {
      // notice is handled by StoreProvider
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Checkout</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-slate-900">Place the order</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
          <div className="grid gap-4">
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

        <aside className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
          <p className="text-lg font-semibold text-slate-900">Order Summary</p>
          <div className="mt-5 space-y-3">
            {cart.items.map((item) => (
              <div key={item.product_id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-slate-500">Qty {item.quantity}</p>
                </div>
                <p className="font-semibold text-slate-900">
                  Rs. {(item.price * item.quantity).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Total</span>
              <span className="font-semibold text-slate-900">
                Rs. {cart.totals.grand_total?.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <Button
            className="mt-6 w-full bg-[#ff6f00] text-white hover:bg-[#f45d00]"
            onClick={handleCheckout}
            disabled={loading || cart.items.length === 0}
          >
            Place Order
          </Button>
          <p className="mt-3 text-xs leading-6 text-slate-500">
            Normal items complete successfully. Chaos demo items trigger deterministic backend failures and create incidents for Claude/MCP investigation.
          </p>
        </aside>
      </div>
    </div>
  );
}
