from fastapi import APIRouter

from app.models.schemas import CartItem
from app.services.storefront_service import add_item_to_cart

router = APIRouter(prefix="/api/cart", tags=["cart"])


@router.post("/add")
def add_to_cart(item: CartItem):
    cart = add_item_to_cart(None, item.product_id, item.quantity)
    return {"status": "success", "session_id": cart["session_id"], "cart": cart}
