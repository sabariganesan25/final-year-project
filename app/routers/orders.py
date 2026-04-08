from fastapi import APIRouter

from app.models.schemas import Order
from app.services.graph_service import PRODUCT_BY_ID, create_order

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("/")
def create_order(order: Order):
    items = []
    for item in order.items:
        product = PRODUCT_BY_ID.get(item.product_id)
        if not product:
            raise RuntimeError("OrderValidationError: product does not exist")
        if product.get("failure_mode") == "db":
            raise RuntimeError("GraphWriteFailure: order transaction failed while writing checkout state to Neo4j")
        items.append({"product_id": item.product_id, "quantity": item.quantity, "price": product["price"]})
    order_id = create_order(order.user_id, items)
    return {"status": "success", "order_id": order_id}


@router.get("/")
def get_orders():
    return {"status": "success", "message": "graph-backed order endpoint"}
