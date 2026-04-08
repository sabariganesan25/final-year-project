import uuid

from fastapi import HTTPException

from app.services.graph_service import (
    add_to_cart,
    clear_cart,
    create_order,
    decrement_inventory,
    get_product,
    list_products as graph_products,
    read_cart,
    search_products as graph_search_products,
)


def get_products():
    return graph_products()


def get_product_by_id(product_id: str):
    return get_product(product_id)


def add_item_to_cart(session_id: str | None, product_id: str, quantity: int):
    if not session_id:
        session_id = str(uuid.uuid4())
    return add_to_cart(session_id, product_id, quantity)


def search_products(query: str):
    if query == "broken_ranking":
        raise RuntimeError("SearchIndexMismatch: graph query referenced an invalid product field")
    return graph_search_products(query)


def register_checkout(session_id: str, customer: dict):
    cart = read_cart(session_id)
    if not cart["items"]:
        raise HTTPException(status_code=400, detail="Cart is empty")

    if any(item.get("failure_mode") == "db" for item in cart["items"]):
        raise RuntimeError("GraphWriteFailure: order transaction failed while writing checkout state to Neo4j")

    order_id = create_order(customer.get("user_id", "u1"), cart["items"])
    payment = process_payment(order_id, cart["totals"]["grand_total"], cart)
    for item in cart["items"]:
        decrement_inventory(item["product_id"])
    clear_cart(session_id)
    return {"status": "success", "order_id": order_id, "payment": payment, "customer": customer}


def process_payment(order_id: str, amount: float, cart: dict):
    if any(item.get("failure_mode") == "payment" for item in cart["items"]):
        raise RuntimeError("PaymentTimeout: external payment gateway timed out during authorization")
    return {"status": "success", "transaction_id": f"txn-{order_id}", "amount": amount}


def get_cart(session_id: str):
    return read_cart(session_id)
