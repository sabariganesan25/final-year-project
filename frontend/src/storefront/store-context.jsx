import { createContext, startTransition, useCallback, useEffect, useMemo, useState } from "react";

import { api } from "../lib/api";

const StoreContext = createContext(null);
const SESSION_KEY = "ai-devops-store-session";

function ensureSessionId() {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const next = crypto.randomUUID();
  window.localStorage.setItem(SESSION_KEY, next);
  return next;
}

export function StoreProvider({ children }) {
  const [sessionId, setSessionId] = useState(null);
  const [cart, setCart] = useState({ items: [], totals: { subtotal: 0, shipping: 0, grand_total: 0 } });
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [lastOrder, setLastOrder] = useState(null);

  useEffect(() => {
    const nextSessionId = ensureSessionId();
    setSessionId(nextSessionId);
    api
      .getStoreCart(nextSessionId)
      .then((payload) => {
        startTransition(() => setCart(payload.cart));
      })
      .catch(() => {})
      .finally(() => setInitializing(false));
  }, []);

  const refreshCart = useCallback(async () => {
    if (!sessionId) return;
    const payload = await api.getStoreCart(sessionId);
    setCart(payload.cart);
  }, [sessionId]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    if (!sessionId) return;
    setLoading(true);
    setNotice(null);
    setLastOrder(null);
    try {
      const payload = await api.addStoreCartItem({ session_id: sessionId, product_id: productId, quantity });
      setCart(payload.cart);
      setNotice({ type: "success", message: "Item added to cart successfully." });
      return payload.cart;
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message,
        incidentId: error.payload?.incident_id,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const checkout = useCallback(async (details) => {
    if (!sessionId) return null;
    setLoading(true);
    setNotice(null);
    try {
      const payload = await api.checkoutStoreCart({ session_id: sessionId, ...details });
      setCart({ session_id: sessionId, items: [], totals: { subtotal: 0, shipping: 0, grand_total: 0 } });
       setLastOrder(payload);
      setNotice({ type: "success", message: "Order placed successfully." });
      return payload;
    } catch (error) {
      setLastOrder(null);
      setNotice({
        type: "error",
        message: error.message,
        incidentId: error.payload?.incident_id,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const resetDemo = useCallback(() => {
    const nextSessionId = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, nextSessionId);
    setSessionId(nextSessionId);
    setCart({ session_id: nextSessionId, items: [], totals: { subtotal: 0, shipping: 0, grand_total: 0 } });
    setNotice({ type: "success", message: "Demo reset complete. You can test from scratch now." });
    setLastOrder(null);
  }, []);

  const value = useMemo(
    () => ({
      sessionId,
      cart,
      initializing,
      loading,
      notice,
      lastOrder,
      setNotice,
      refreshCart,
      addToCart,
      checkout,
      resetDemo,
    }),
    [addToCart, cart, checkout, initializing, lastOrder, loading, notice, refreshCart, resetDemo, sessionId],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export { StoreContext };
