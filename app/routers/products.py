from fastapi import APIRouter

from app.services.storefront_service import search_products

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("/search")
def search_products_endpoint(q: str):
    hits = search_products(q)
    return {"status": "success", "hits": hits}
