from fastapi import APIRouter

from app.models.schemas import PaymentRequest

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post("/charge")
def charge_payment(payment: PaymentRequest):
    raise RuntimeError("PaymentTimeout: external payment gateway timed out during authorization")
