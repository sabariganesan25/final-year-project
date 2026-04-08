from fastapi import APIRouter

from app.models.schemas import CheckoutRequest, StorefrontCartRequest, StorefrontPaymentRequest
from app.services.storefront_service import (
    add_item_to_cart,
    get_cart as get_storefront_cart,
    get_product_by_id,
    get_products,
    process_payment,
    register_checkout,
)

router = APIRouter(tags=["shop"])


@router.get("/products")
def list_products():
    return {"status": "success", "products": get_products()}


@router.get("/products/{product_id}")
def product_detail(product_id: str):
    return {"status": "success", "product": get_product_by_id(product_id)}


@router.post("/cart")
def add_to_cart(payload: StorefrontCartRequest):
    cart = add_item_to_cart(payload.session_id, payload.product_id, payload.quantity)
    return {"status": "success", "cart": cart}


@router.get("/cart/{session_id}")
def get_cart(session_id: str):
    return {"status": "success", "cart": get_storefront_cart(session_id)}


@router.post("/checkout")
def place_order(payload: CheckoutRequest):
    result = register_checkout(
        payload.session_id,
        {
            "customer_name": payload.customer_name,
            "email": payload.email,
            "address": payload.address,
            "user_id": payload.user_id or "u1",
        },
    )
    return result


@router.post("/payment")
def payment(payload: StorefrontPaymentRequest):
    cart = get_storefront_cart(payload.session_id)
    amount = payload.amount or cart["totals"]["grand_total"]
    return process_payment(payload.order_id or 0, amount, cart)
