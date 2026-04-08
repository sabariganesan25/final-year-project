from pydantic import BaseModel
from typing import List, Optional

class Product(BaseModel):
    id: str
    name: str
    description: str
    price: float
    stock: int

class User(BaseModel):
    id: str
    username: str
    email: str

class OrderItem(BaseModel):
    product_id: str
    quantity: int

class Order(BaseModel):
    user_id: str
    items: List[OrderItem]

class CartItem(BaseModel):
    product_id: str
    quantity: int

class PaymentRequest(BaseModel):
    order_id: str
    amount: float
    stripe_token: str


class StorefrontCartRequest(BaseModel):
    session_id: Optional[str] = None
    product_id: str
    quantity: int = 1


class CheckoutRequest(BaseModel):
    session_id: str
    customer_name: str
    email: str
    address: str
    user_id: Optional[str] = "u1"


class StorefrontPaymentRequest(BaseModel):
    session_id: str
    order_id: Optional[int] = None
    amount: Optional[float] = None
