import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, RefreshCw, ShieldCheck, ShoppingBag } from "lucide-react";

import { Button } from "../../components/ui/button";
import { api } from "../../lib/api";
import { titleCase } from "../../lib/formatters";
import { useEffect, useState } from "react";
import { useStore } from "../../storefront/use-store";

const DEMO_STEPS = [
  {
    title: "1. Start Fresh",
    body: "Reset the demo session so the cart is empty and the test begins from a clean state.",
    icon: RefreshCw,
  },
  {
    title: "2. Add a Product",
    body: "Choose a normal or chaos-demo product and add it to the cart.",
    icon: ShoppingBag,
  },
  {
    title: "3. Place the Order",
    body: "Go through checkout to create either a successful order or a real incident.",
    icon: ShieldCheck,
  },
  {
    title: "4. Investigate",
    body: "Open the Ops Console or Claude Desktop to inspect the incident lifecycle.",
    icon: AlertTriangle,
  },
];

export default function HomePage() {
  const { addToCart, loading, resetDemo } = useStore();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api
      .getStoreProducts()
      .then((payload) => setProducts(payload.products ?? []))
      .catch(() => setProducts([]));
  }, []);

  return (
    <div className="pb-16">
      <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_40%),linear-gradient(140deg,#ffffff,#eef4ff)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-blue-600">E-Commerce Test Bench</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-slate-900">
              Shop, break the platform on purpose, and retest from scratch in one clean flow.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              This storefront is built for demo reliability. Pick a product, trigger an incident, inspect it in the ops
              console, then reset the session and test again.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button type="button" className="bg-[#0b57d0] text-white hover:bg-[#0848ae]" onClick={resetDemo}>
                <RefreshCw size={16} />
                Reset Demo Session
              </Button>
              <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
                <Link to="/cart">
                  Go to Cart
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
                <Link to="/ops">Open Ops Console</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            {DEMO_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{step.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Catalog</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-slate-900">Choose a test scenario</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            Normal products help you verify the happy path. Chaos demo products intentionally trigger cart, checkout, and
            payment incidents so you can test the full AI DevOps workflow.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)]"
            >
              <img src={product.image} alt={product.name} className="h-56 w-full object-cover" />
              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {titleCase(product.category)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      product.failure_mode ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {product.failure_mode ? "Chaos Demo" : "Normal Flow"}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{product.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{product.description}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                  <p className="font-medium text-slate-900">
                    {product.failure_mode
                      ? `Triggers ${product.failure_mode} failure`
                      : "Safe product for success-path testing"}
                  </p>
                  <p className="mt-1 text-slate-500">Stock: {product.stock} units available</p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold text-slate-900">Rs. {product.price.toLocaleString("en-IN")}</p>
                    <p className="text-sm text-slate-500">Rating {product.rating}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => addToCart(product.id, 1)}
                      disabled={loading}
                      className="bg-[#ffb400] text-slate-900 hover:bg-[#ffa000]"
                    >
                      Add
                    </Button>
                    <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
                      <Link to={`/product/${product.id}`}>Details</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
