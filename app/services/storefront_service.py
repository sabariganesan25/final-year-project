import logging
import time
import uuid

from fastapi import HTTPException

from app.exceptions import CheckoutUnavailableError
from app.services.graph_service import (
    add_to_cart,
    clear_cart,
    create_order,
    decrement_inventory,
    get_product,
    is_demo_failure_active,
    list_products as graph_products,
    read_cart,
    search_products as graph_search_products,
)

logger = logging.getLogger(__name__)


def get_products():
    return graph_products()


def get_product_by_id(product_id: str):
    return get_product(product_id)


def add_item_to_cart(session_id: str | None, product_id: str, quantity: int):
    if not session_id:
        session_id = str(uuid.uuid4())
    return add_to_cart(session_id, product_id, quantity)


def search_products(query: str):
    if query == "broken_ranking" and is_demo_failure_active("search-index"):
        raise RuntimeError("SearchIndexMismatch: graph query referenced an invalid product field")
    return graph_search_products(query)


def _create_order_with_retry(user_id: str, items: list[dict], retries: int = 3, backoff: float = 0.5):
    for attempt in range(retries):
        try:
            if any(item.get("failure_mode") == "db" for item in items) and is_demo_failure_active("db"):
                raise RuntimeError("GraphWriteFailure: order transaction failed while writing checkout state to Neo4j")
            return create_order(user_id, items)
        except Exception:
            if attempt == retries - 1:
                raise
            time.sleep(backoff * (2**attempt))


def register_checkout(session_id: str, customer: dict):
    cart = read_cart(session_id)
    if not cart["items"]:
        raise HTTPException(status_code=400, detail="Cart is empty")

    try:
        order_id = _create_order_with_retry(customer.get("user_id", "u1"), cart["items"])
    except Exception as exc:
        logger.error(
            "CheckoutUnavailable",
            extra={
                "service": "orders",
                "customer": customer.get("email", "unknown"),
                "session_id": session_id,
                "error": str(exc),
            },
        )
        raise CheckoutUnavailableError() from exc

    payment = process_payment(order_id, cart["totals"]["grand_total"], cart)
    for item in cart["items"]:
        decrement_inventory(item["product_id"])
    clear_cart(session_id)
    return {"status": "success", "order_id": order_id, "payment": payment, "customer": customer}


def process_payment(order_id: str, amount: float, cart: dict):
    if any(item.get("failure_mode") == "payment" for item in cart["items"]) and is_demo_failure_active("payment"):
        raise RuntimeError("PaymentTimeout: external payment gateway timed out during authorization")
    return {"status": "success", "transaction_id": f"txn-{order_id}", "amount": amount}


def get_cart(session_id: str):
    return read_cart(session_id)
