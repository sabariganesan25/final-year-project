import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShieldAlert, ShoppingCart, Star } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { api } from "../../lib/api";
import { titleCase } from "../../lib/formatters";
import { useStore } from "../../storefront/use-store";

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart, loading } = useStore();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    api
      .getStoreProduct(id)
      .then((payload) => setProduct(payload.product))
      .catch(() => setProduct(null));
  }, [id]);

  if (!product) {
    return <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">Loading product...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-[#0b57d0]">
        <ArrowLeft size={16} />
        Back to products
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
          <img src={product.image} alt={product.name} className="h-[420px] w-full rounded-[24px] object-cover" />
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {titleCase(product.category)}
            </span>
            {product.failure_mode ? (
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                Chaos Demo
              </span>
            ) : null}
          </div>

          <h1 className="mt-5 font-display text-4xl font-semibold text-slate-900">{product.name}</h1>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <Star size={16} className="fill-[#ffb400] text-[#ffb400]" />
            {product.rating} customer rating
          </div>
          <p className="mt-6 text-4xl font-semibold text-slate-900">
            Rs. {product.price.toLocaleString("en-IN")}
          </p>
          <p className="mt-5 text-base leading-8 text-slate-600">{product.description}</p>

          {product.failure_mode ? (
            <div className="mt-6 rounded-3xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
              <div className="flex items-start gap-3">
                <ShieldAlert size={18} className="mt-0.5" />
                <div>
                  <p className="font-semibold">This item is wired to a backend failure path.</p>
                  <p className="mt-1">
                    {product.failure_mode === "redis" && "Adding this item to cart simulates a Redis cart failure."}
                    {product.failure_mode === "db" && "Checking out this item simulates an order database failure."}
                    {product.failure_mode === "payment" && "Placing an order with this item simulates a payment timeout."}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Input
              type="number"
              min="1"
              className="max-w-28 border-slate-200 bg-white text-slate-900"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
            <Button
              onClick={() => addToCart(product.id, quantity)}
              disabled={loading}
              className="bg-[#ffb400] text-slate-900 hover:bg-[#ffa000]"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </Button>
            <Button asChild variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
              <Link to="/cart">Go to Cart</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
