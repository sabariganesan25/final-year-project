from fastapi import APIRouter

from app.services.graph_service import decrement_inventory

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("/{product_id}")
def check_inventory(product_id: str):
    stock_remaining = decrement_inventory(product_id)
    return {"status": "success", "stock_remaining": stock_remaining}
