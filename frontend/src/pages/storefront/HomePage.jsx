import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Star } from "lucide-react";

import { Button } from "../../components/ui/button";
import { api } from "../../lib/api";
import { titleCase } from "../../lib/formatters";

export default function HomePage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api
      .getStoreProducts()
      .then((payload) => setProducts(payload.products ?? []))
      .catch(() => setProducts([]));
  }, []);

  return (
    <div className="pb-16">
      <section className="bg-[linear-gradient(120deg,#0b57d0,#3f8cff)] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-blue-100">Flipkart-style storefront</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-tight">
              Shop real products, trigger real incidents, and investigate them with Claude Desktop.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-50">
              Add products to cart, place an order, and use chaos-ready items to simulate Redis, database, and payment failures through normal user actions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="bg-white text-[#0b57d0] hover:bg-slate-100">
                <a href="#catalog">Browse Products</a>
              </Button>
              <Button asChild variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/15">
                <Link to="/ops">Open DevOps Console</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[32px] bg-white/10 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.18)] backdrop-blur">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "Redis Crash", helper: "Add the FlashCart Festival Bundle" },
                { label: "DB Failure", helper: "Checkout the Warehouse Sync Console" },
                { label: "Payment Failure", helper: "Place order with Premium Payment Test Pass" },
                { label: "Claude RCA", helper: "Investigate the created incident via MCP" },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl bg-white/12 p-4">
                  <p className="font-medium">{item.label}</p>
                  <p className="mt-2 text-sm text-blue-100">{item.helper}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="catalog" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Featured Products</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-slate-900">Choose a flow to test</h2>
          </div>
          <p className="max-w-xl text-sm text-slate-500">
            Chaos demo items are clearly tagged so you can trigger specific backend failures while still following a real e-commerce flow.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
              <img src={product.image} alt={product.name} className="h-60 w-full object-cover" />
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
                    {product.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{product.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{product.description}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Star size={16} className="fill-[#ffb400] text-[#ffb400]" />
                  {product.rating} rating
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-semibold text-slate-900">
                      Rs. {product.price.toLocaleString("en-IN")}
                    </p>
                    <p className="text-sm text-slate-500">{product.stock} left in stock</p>
                  </div>
                  <Button asChild className="bg-[#0b57d0] text-white hover:bg-[#0848ae]">
                    <Link to={`/product/${product.id}`}>
                      View
                      <ChevronRight size={16} />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
