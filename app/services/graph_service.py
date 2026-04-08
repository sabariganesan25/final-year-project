import json
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException

from app.db.neo4j_client import get_neo4j_driver


def utcnow():
    return datetime.now(timezone.utc)


def to_iso(value=None):
    value = value or utcnow()
    return value.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


TEAMS = [
    {"name": "Platform"},
    {"name": "Commerce"},
    {"name": "Billing"},
    {"name": "Search"},
    {"name": "SupplyChain"},
]

COMPONENTS = [
    {"name": "storefront-ui", "type": "frontend", "team": "Platform"},
    {"name": "cart-cache", "type": "cache", "team": "Commerce"},
    {"name": "checkout-orchestrator", "type": "workflow", "team": "Commerce"},
    {"name": "payment-gateway", "type": "external-api", "team": "Billing"},
    {"name": "catalog-search", "type": "search", "team": "Search"},
    {"name": "inventory-engine", "type": "inventory", "team": "SupplyChain"},
    {"name": "neo4j-core", "type": "graph-db", "team": "Platform"},
]

SERVICES = [
    {"name": "api-gateway", "team": "Platform", "status": "healthy"},
    {"name": "orders", "team": "Commerce", "status": "healthy"},
    {"name": "cart", "team": "Commerce", "status": "healthy"},
    {"name": "payments", "team": "Billing", "status": "healthy"},
    {"name": "search", "team": "Search", "status": "healthy"},
    {"name": "inventory", "team": "SupplyChain", "status": "healthy"},
]

SERVICE_DEPENDENCIES = {
    "api-gateway": ["storefront-ui"],
    "orders": ["checkout-orchestrator", "neo4j-core"],
    "cart": ["cart-cache", "neo4j-core"],
    "payments": ["payment-gateway", "neo4j-core"],
    "search": ["catalog-search", "neo4j-core"],
    "inventory": ["inventory-engine", "neo4j-core"],
}

SERVICE_IMPACTS = {
    "api-gateway": ["orders", "cart", "payments", "search", "inventory"],
    "orders": ["payments", "inventory"],
    "cart": ["orders"],
    "payments": ["orders"],
    "search": ["api-gateway"],
    "inventory": ["orders"],
}

PRODUCTS = [
    {
        "id": "sku-phone",
        "name": "Nebula X Pro Smartphone",
        "description": "Flagship camera, 120Hz AMOLED display, and all-day battery life.",
        "price": 54999.0,
        "category": "Mobiles",
        "rating": 4.7,
        "stock": 18,
        "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
        "badge": "Best Seller",
        "failure_mode": "",
    },
    {
        "id": "sku-laptop",
        "name": "AetherBook 14 Laptop",
        "description": "Lightweight productivity laptop built for hybrid work and creators.",
        "price": 72990.0,
        "category": "Laptops",
        "rating": 4.6,
        "stock": 9,
        "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80",
        "badge": "Top Rated",
        "failure_mode": "",
    },
    {
        "id": "sku-headphones",
        "name": "Pulse ANC Headphones",
        "description": "Adaptive noise cancellation with 40-hour playback and spatial audio.",
        "price": 8999.0,
        "category": "Audio",
        "rating": 4.5,
        "stock": 28,
        "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
        "badge": "Fast Delivery",
        "failure_mode": "",
    },
    {
        "id": "sku-redis-demo",
        "name": "FlashCart Festival Bundle",
        "description": "A promo pack used to simulate a cart-cache failure during add-to-cart.",
        "price": 1999.0,
        "category": "Promo",
        "rating": 4.2,
        "stock": 50,
        "image": "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
        "badge": "Chaos Demo",
        "failure_mode": "redis",
    },
    {
        "id": "sku-db-demo",
        "name": "Warehouse Sync Console",
        "description": "A demo SKU that forces an order-write failure during checkout.",
        "price": 12999.0,
        "category": "Gaming",
        "rating": 4.3,
        "stock": 6,
        "image": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=80",
        "badge": "Chaos Demo",
        "failure_mode": "db",
    },
    {
        "id": "sku-payment-demo",
        "name": "Premium Payment Test Pass",
        "description": "A checkout item that intentionally triggers a payment timeout path.",
        "price": 499.0,
        "category": "Services",
        "rating": 4.0,
        "stock": 100,
        "image": "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80",
        "badge": "Chaos Demo",
        "failure_mode": "payment",
    },
]

DEFAULT_USERS = [
    {"id": "u1", "username": "alice", "email": "alice@example.com"},
    {"id": "u2", "username": "bob", "email": "bob@example.com"},
]

DEMO_FAILURES = [
    {
        "mode": "redis",
        "label": "Cart Cache Failure",
        "service": "cart",
        "description": "Chaos demo for add-to-cart failures",
        "active": True,
    },
    {
        "mode": "db",
        "label": "Checkout Graph Write Failure",
        "service": "orders",
        "description": "Chaos demo for order persistence failures",
        "active": True,
    },
    {
        "mode": "payment",
        "label": "Payment Timeout",
        "service": "payments",
        "description": "Chaos demo for payment authorization failures",
        "active": True,
    },
    {
        "mode": "search-index",
        "label": "Search Index Failure",
        "service": "search",
        "description": "Chaos demo for product discovery failures",
        "active": True,
    },
    {
        "mode": "inventory-oversell",
        "label": "Inventory Oversell",
        "service": "inventory",
        "description": "Chaos demo for stock reservation failures",
        "active": True,
    },
]

PRODUCT_BY_ID = {product["id"]: product for product in PRODUCTS}
SERVICE_COMPONENT_MAP = {
    "api-gateway": "storefront-ui",
    "orders": "checkout-orchestrator",
    "cart": "cart-cache",
    "payments": "payment-gateway",
    "search": "catalog-search",
    "inventory": "inventory-engine",
}


def run_cypher(query, parameters=None):
    driver = get_neo4j_driver()
    with driver.session() as session:
        result = session.run(query, parameters or {})
        return [record.data() for record in result]


def execute_write(query, parameters=None):
    driver = get_neo4j_driver()
    with driver.session() as session:
        session.run(query, parameters or {}).consume()


def initialize_graph():
    constraints = [
        "CREATE CONSTRAINT service_name IF NOT EXISTS FOR (n:Service) REQUIRE n.name IS UNIQUE",
        "CREATE CONSTRAINT component_name IF NOT EXISTS FOR (n:Component) REQUIRE n.name IS UNIQUE",
        "CREATE CONSTRAINT team_name IF NOT EXISTS FOR (n:Team) REQUIRE n.name IS UNIQUE",
        "CREATE CONSTRAINT incident_id IF NOT EXISTS FOR (n:Incident) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT errorlog_id IF NOT EXISTS FOR (n:ErrorLog) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT product_id IF NOT EXISTS FOR (n:Product) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT user_id IF NOT EXISTS FOR (n:User) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT cart_session IF NOT EXISTS FOR (n:Cart) REQUIRE n.session_id IS UNIQUE",
        "CREATE CONSTRAINT order_id IF NOT EXISTS FOR (n:Order) REQUIRE n.order_id IS UNIQUE",
        "CREATE CONSTRAINT demo_mode IF NOT EXISTS FOR (n:DemoControl) REQUIRE n.mode IS UNIQUE",
    ]
    for statement in constraints:
        execute_write(statement)

    execute_write(
        """
        UNWIND $teams AS team
        MERGE (:Team {name: team.name})
        """,
        {"teams": TEAMS},
    )
    execute_write(
        """
        UNWIND $components AS component
        MERGE (c:Component {name: component.name})
        SET c.type = component.type
        WITH c, component
        MATCH (t:Team {name: component.team})
        MERGE (c)-[:MAINTAINED_BY]->(t)
        """,
        {"components": COMPONENTS},
    )
    execute_write(
        """
        UNWIND $services AS service
        MERGE (s:Service {name: service.name})
        SET s.status = service.status
        WITH s, service
        MATCH (t:Team {name: service.team})
        MERGE (s)-[:OWNED_BY]->(t)
        """,
        {"services": SERVICES},
    )
    for service_name, components in SERVICE_DEPENDENCIES.items():
        execute_write(
            """
            MATCH (s:Service {name: $service_name})
            UNWIND $components AS component_name
            MATCH (c:Component {name: component_name})
            MERGE (s)-[:DEPENDS_ON]->(c)
            """,
            {"service_name": service_name, "components": components},
        )
    for source, targets in SERVICE_IMPACTS.items():
        execute_write(
            """
            MATCH (s:Service {name: $source})
            UNWIND $targets AS target_name
            MATCH (t:Service {name: target_name})
            MERGE (s)-[:IMPACTS]->(t)
            """,
            {"source": source, "targets": targets},
        )
    execute_write(
        """
        UNWIND $products AS product
        MERGE (p:Product {id: product.id})
        SET p.name = product.name,
            p.description = product.description,
            p.price = product.price,
            p.category = product.category,
            p.rating = product.rating,
            p.stock = product.stock,
            p.image = product.image,
            p.badge = product.badge,
            p.failure_mode = product.failure_mode
        """,
        {"products": PRODUCTS},
    )
    execute_write(
        """
        UNWIND $users AS user
        MERGE (u:User {id: user.id})
        SET u.username = user.username,
            u.email = user.email
        """,
        {"users": DEFAULT_USERS},
    )
    execute_write(
        """
        UNWIND $controls AS control
        MERGE (d:DemoControl {mode: control.mode})
        SET d.label = control.label,
            d.service = control.service,
            d.description = control.description,
            d.active = COALESCE(d.active, control.active)
        """,
        {"controls": DEMO_FAILURES},
    )


def infer_component(service_name: str, error_type: str = "", error_message: str = ""):
    message = f"{error_type} {error_message}".lower()
    if "payment" in message or service_name == "payments":
        return "payment-gateway"
    if "redis" in message or "cache" in message or service_name == "cart":
        return "cart-cache"
    if "inventory" in message or service_name == "inventory":
        return "inventory-engine"
    if "search" in message or service_name == "search":
        return "catalog-search"
    return SERVICE_COMPONENT_MAP.get(service_name, "storefront-ui")


def ensure_user(user_id="u1", username="alice", email="alice@example.com"):
    execute_write(
        """
        MERGE (u:User {id: $user_id})
        SET u.username = COALESCE(u.username, $username),
            u.email = COALESCE(u.email, $email)
        """,
        {"user_id": user_id, "username": username, "email": email},
    )


def list_products():
    rows = run_cypher(
        """
        MATCH (p:Product)
        RETURN p
        ORDER BY p.category, p.name
        """
    )
    return [dict(row["p"]) for row in rows]


def get_product(product_id: str):
    rows = run_cypher("MATCH (p:Product {id: $product_id}) RETURN p", {"product_id": product_id})
    if not rows:
        raise HTTPException(status_code=404, detail="Product not found")
    return dict(rows[0]["p"])


def search_products(query: str):
    rows = run_cypher(
        """
        MATCH (p:Product)
        WHERE toLower(p.name) CONTAINS toLower($query)
           OR toLower(p.category) CONTAINS toLower($query)
        RETURN p
        ORDER BY p.name
        """,
        {"query": query},
    )
    return [dict(row["p"]) for row in rows]


def read_cart(session_id: str):
    rows = run_cypher(
        """
        MERGE (c:Cart {session_id: $session_id})
        RETURN c
        """,
        {"session_id": session_id},
    )
    rows = run_cypher(
        """
        MATCH (c:Cart {session_id: $session_id})
        OPTIONAL MATCH (c)-[rel:CONTAINS]->(p:Product)
        RETURN c, collect({
            product_id: p.id,
            name: p.name,
            price: p.price,
            quantity: rel.quantity,
            image: p.image,
            failure_mode: p.failure_mode
        }) AS items
        """,
        {"session_id": session_id},
    )
    record = rows[0]
    items = [item for item in record["items"] if item.get("product_id")]
    subtotal = round(sum(item["price"] * item["quantity"] for item in items), 2)
    shipping = 0.0 if subtotal >= 999 else 149.0
    return {
        "session_id": session_id,
        "items": items,
        "totals": {
            "subtotal": subtotal,
            "shipping": shipping,
            "grand_total": round(subtotal + shipping, 2),
        },
    }


def add_to_cart(session_id: str, product_id: str, quantity: int):
    product = get_product(product_id)
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1")
    if (product.get("failure_mode") == "redis" and is_demo_failure_active("redis")) or quantity > 1000:
        raise RuntimeError("RedisCrash: cart cache could not persist the selected item")

    execute_write(
        """
        MERGE (c:Cart {session_id: $session_id})
        WITH c
        MATCH (p:Product {id: $product_id})
        MERGE (c)-[rel:CONTAINS]->(p)
        SET rel.quantity = COALESCE(rel.quantity, 0) + $quantity
        """,
        {"session_id": session_id, "product_id": product_id, "quantity": quantity},
    )
    return read_cart(session_id)


def clear_cart(session_id: str):
    execute_write(
        """
        MATCH (c:Cart {session_id: $session_id})-[rel:CONTAINS]->(:Product)
        DELETE rel
        """,
        {"session_id": session_id},
    )


def create_order(user_id: str, items: list[dict]):
    ensure_user(user_id=user_id)
    order_id = f"ord-{uuid.uuid4().hex[:10]}"
    execute_write(
        """
        MATCH (u:User {id: $user_id})
        CREATE (o:Order {
            order_id: $order_id,
            status: 'PLACED',
            timestamp: $timestamp
        })
        MERGE (u)-[:PLACED]->(o)
        WITH o
        UNWIND $items AS item
        MATCH (p:Product {id: item.product_id})
        MERGE (o)-[rel:INCLUDES]->(p)
        SET rel.quantity = item.quantity,
            rel.price = item.price
        """,
        {"user_id": user_id, "order_id": order_id, "timestamp": to_iso(), "items": items},
    )
    return order_id


def register_user(user):
    ensure_user(user_id=user.id, username=user.username, email=user.email)
    return {"status": "success"}


def decrement_inventory(product_id: str):
    product = get_product(product_id)
    if product["stock"] <= 0:
        raise RuntimeError("InventoryRaceCondition: oversold product")
    execute_write(
        """
        MATCH (p:Product {id: $product_id})
        SET p.stock = p.stock - 1
        """,
        {"product_id": product_id},
    )
    return max(product["stock"] - 1, 0)


def list_demo_controls():
    rows = run_cypher(
        """
        MATCH (d:DemoControl)
        RETURN d
        ORDER BY d.service, d.mode
        """
    )
    return [dict(row["d"]) for row in rows]


def is_demo_failure_active(mode: str) -> bool:
    rows = run_cypher("MATCH (d:DemoControl {mode: $mode}) RETURN d.active AS active", {"mode": mode})
    if not rows:
        return True
    return bool(rows[0].get("active", True))


def set_demo_failure_active(mode: str, active: bool):
    execute_write(
        """
        MATCH (d:DemoControl {mode: $mode})
        SET d.active = $active,
            d.updated_at = $updated_at
        """,
        {"mode": mode, "active": active, "updated_at": to_iso()},
    )
    rows = run_cypher("MATCH (d:DemoControl {mode: $mode}) RETURN d", {"mode": mode})
    return dict(rows[0]["d"]) if rows else None


def reset_demo_controls(active: bool = True):
    execute_write(
        """
        MATCH (d:DemoControl)
        SET d.active = $active,
            d.updated_at = $updated_at
        """,
        {"active": active, "updated_at": to_iso()},
    )
    return list_demo_controls()
