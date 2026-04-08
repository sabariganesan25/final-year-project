import { Link } from "react-router-dom";

import { Button } from "../../components/ui/button";
import { useStore } from "../../storefront/use-store";

export default function CartPage() {
  const { cart, resetDemo } = useStore();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Cart</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-slate-900">Review your test basket</h1>
        </div>
        <Button type="button" variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50" onClick={resetDemo}>
          Start Over
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {cart.items.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-lg font-medium text-slate-900">Your cart is empty</p>
              <p className="mt-2 text-sm text-slate-500">Start from the catalog and add a product to test the flow.</p>
              <Button asChild className="mt-5 bg-[#0b57d0] text-white hover:bg-[#0848ae]">
                <Link to="/">Go to Catalog</Link>
              </Button>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.product_id} className="flex gap-4 rounded-[28px] border border-slate-200 bg-white p-4">
                <img src={item.image} alt={item.name} className="h-28 w-24 rounded-2xl object-cover" />
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-500">Quantity: {item.quantity}</p>
                    <p className="mt-1 text-sm text-slate-500">Product ID: {item.product_id}</p>
                    {item.failure_mode ? (
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-orange-600">
                        Chaos demo item: {item.failure_mode} incident path
                      </p>
                    ) : (
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-emerald-600">
                        Normal purchase path
                      </p>
                    )}
                  </div>
                  <p className="text-xl font-semibold text-slate-900">Rs. {item.price.toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <aside className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
          <p className="text-lg font-semibold text-slate-900">Cart Summary</p>
          <dl className="mt-6 space-y-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <dt>Items</dt>
              <dd>{cart.items.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>Rs. {cart.totals.subtotal?.toLocaleString("en-IN")}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd>Rs. {cart.totals.shipping?.toLocaleString("en-IN")}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
              <dt>Total</dt>
              <dd>Rs. {cart.totals.grand_total?.toLocaleString("en-IN")}</dd>
            </div>
          </dl>

          <div className="mt-6 space-y-3">
            <Button asChild className="w-full bg-[#ff6f00] text-white hover:bg-[#f45d00]" disabled={cart.items.length === 0}>
              <Link to="/checkout">Proceed to Checkout</Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
              <Link to="/">Add More Products</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
