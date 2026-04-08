import httpx
import asyncio

async def simulate_db_pool_exhaustion():
    print("Simulating DB Pool Exhaustion...")
    # Trigger 50 concurrent requests to exhaust unpooled psycopg2 connections
    async with httpx.AsyncClient() as client:
        tasks = [client.get("http://localhost:8000/api/orders") for _ in range(50)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        print(f"Issued {len(results)} requests to /api/orders")

async def simulate_redis_oom():
    print("Simulating Redis OOM...")
    # Add huge payload to cart to trigger redis exception
    async with httpx.AsyncClient() as client:
        res = await client.post("http://localhost:8000/api/cart/add", json={"product_id": "p1", "quantity": 10000})
        print(f"Cart Response: {res.status_code}")

async def simulate_elasticsearch_failure():
    print("Simulating Elasticsearch Ranking Failure...")
    async with httpx.AsyncClient() as client:
        res = await client.get("http://localhost:8000/api/products/search?q=broken_ranking")
        print(f"Search Response: {res.status_code}")

async def simulate_payment_timeout():
    print("Simulating Payment Timeout...")
    async with httpx.AsyncClient(timeout=40.0) as client:
        res = await client.post("http://localhost:8000/api/payments/charge", json={"order_id": "o1", "amount": 100.0, "stripe_token": "tok_123"})
        print(f"Payment Response: {res.status_code}")

async def simulate_inventory_race():
    print("Simulating Inventory Race Condition...")
    async with httpx.AsyncClient() as client:
        tasks = [client.get("http://localhost:8000/api/inventory/p3") for _ in range(5)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        print(f"Issued {len(results)} requests to /api/inventory")

async def main():
    print("--- Triggering Incidents ---")
    await simulate_db_pool_exhaustion()
    await simulate_redis_oom()
    await simulate_elasticsearch_failure()
    await simulate_inventory_race()
    # Skip payment timeout by default to avoid slow execution, uncomment to run:
    # await simulate_payment_timeout()
    print("--- Done ---")

if __name__ == "__main__":
    asyncio.run(main())
