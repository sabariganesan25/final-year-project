from datetime import datetime, timezone
import typing

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.middleware.error_logger import ErrorLoggerMiddleware
from app.routers import aiops, cart, dashboard, inventory, orders, payments, platform, products, shop, users
from app.services.incident_service import initialize_storage

app = FastAPI(title="E-Commerce API", version="2.0.0")

app.add_middleware(ErrorLoggerMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConnectionManager:
    def __init__(self):
        self.active_connections: typing.List[WebSocket] = []
        self.event_history: typing.List[dict] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        await websocket.send_json(
            {
                "type": "CONNECTED",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "message": "Real-time incident stream connected",
            }
        )
        if self.event_history:
            await websocket.send_json({"type": "SNAPSHOT", "events": self.event_history[-10:]})

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        self.event_history.append(message)
        self.event_history = self.event_history[-50:]

        stale_connections = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                stale_connections.append(connection)

        for connection in stale_connections:
            self.disconnect(connection)


initialize_storage()
manager = ConnectionManager()
app.state.ws_manager = manager


@app.websocket("/ws/incidents")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive()
            if data["type"] == "websocket.disconnect":
                break
            if data["type"] == "websocket.receive" and data.get("text") == "ping":
                await websocket.send_json({"type": "PONG"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    finally:
        manager.disconnect(websocket)


app.include_router(orders.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(payments.router)
app.include_router(inventory.router)
app.include_router(users.router)
app.include_router(shop.router)
app.include_router(dashboard.router)
app.include_router(aiops.router)
app.include_router(platform.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
