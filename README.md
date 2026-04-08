# Graph-Native AI DevOps Platform for E-Commerce

This repository is an existing AI DevOps platform upgraded into a Neo4j-first GraphRAG system.

The storefront is still used to trigger real operational failures through normal customer actions, the FastAPI backend still powers the e-commerce and ops APIs, the MCP server still exposes investigation tools to Claude Desktop, and the GitHub fix workflow is still available. The main architectural change is that Neo4j is now the single source of truth for incidents, logs, services, components, ownership, and dependency reasoning.

## What Changed

The previous mixed storage model has been replaced with a graph-native data layer.

- Neo4j is now the only operational database used by the platform
- PostgreSQL incident persistence has been removed
- Elasticsearch log storage/search has been removed
- SQLite local incident storage has been removed from runtime
- MCP tools now query only Neo4j
- RCA and fix reasoning are built from graph relationships and linked error evidence

The e-commerce website, ops dashboard, MCP server, Claude workflow, and GitHub PR flow remain part of the system.

## Current System Overview

### Customer-facing website

The React storefront remains the main incident trigger surface.

- Home page shows product catalog cards
- Product page shows details and add-to-cart flow
- Cart page shows selected items
- Checkout page places orders
- Certain products intentionally trigger failure paths

### Ops console

The React ops console under `/ops` remains the main visualization layer.

- Dashboard
- Incident Explorer
- Incident Detail
- Dependency Graph
- Live Monitoring

### Backend

The FastAPI backend still exposes e-commerce and platform APIs.

- product, cart, checkout, payment flows
- simulated failure paths
- incident ingestion middleware
- analytics and graph APIs
- AI RCA and fix endpoints
- WebSocket incident stream

### MCP and Claude Desktop

Claude remains the main AI DevOps interface through MCP.

- search incidents
- inspect dependencies
- compute blast radius
- generate RCA
- suggest fix
- approve fix through the existing GitHub integration

## Neo4j Knowledge Graph Model

The platform now stores all operational knowledge in Neo4j.

### Node labels

- `Service {name, status}`
- `Component {name, type}`
- `Incident {id, severity, timestamp, status, ...}`
- `ErrorLog {id, message, stack_trace, ...}`
- `Team {name}`
- `Product {id, name, price, stock, failure_mode, ...}`
- `Cart {session_id}`
- `Order {order_id, status, timestamp}`
- `User {id, username, email}`

### Relationship model

- `(Service)-[:DEPENDS_ON]->(Component)`
- `(Service)-[:OWNED_BY]->(Team)`
- `(Incident)-[:OCCURRED_IN]->(Service)`
- `(Incident)-[:CAUSED_BY]->(Component)`
- `(Incident)-[:HAS_LOG]->(ErrorLog)`
- `(Component)-[:MAINTAINED_BY]->(Team)`
- `(Service)-[:IMPACTS]->(Service)`
- `(Cart)-[:CONTAINS]->(Product)`
- `(User)-[:PLACED]->(Order)`
- `(Order)-[:INCLUDES]->(Product)`

This lets Claude reason over incidents, service ownership, dependency chains, and blast radius from one graph.

## End-to-End Flow

1. A user browses the storefront and performs a normal action.
2. A chaos-ready product or demo endpoint triggers a real backend exception.
3. FastAPI middleware captures the failure.
4. The backend writes `Incident`, `ErrorLog`, `Service`, and `Component` relationships into Neo4j.
5. A WebSocket event is broadcast to the ops UI.
6. The dashboard, incident explorer, live monitoring page, and graph view update.
7. In Claude Desktop, the user asks an incident question.
8. Claude calls MCP tools that read only from Neo4j.
9. Claude returns graph-backed RCA, dependency evidence, blast radius, and fix steps.
10. If requested, the fix workflow can still generate or approve a GitHub PR.

## Failure Simulation

The system still uses real customer flow as the trigger surface.

### Storefront-triggered failures

- Add `sku-redis-demo` to cart to trigger a cart-cache failure
- Checkout a cart containing `sku-db-demo` to trigger a graph write failure in the order path
- Checkout a cart containing `sku-payment-demo` to trigger a payment timeout

### Ops demo endpoints

- `POST /api/platform/simulate/db-crash`
- `POST /api/platform/simulate/redis-oom`
- `POST /api/platform/simulate/api-timeout`

Each path results in an incident being written to Neo4j.

## Key Backend Files

- [app/main.py](/D:/final%20year%20project/ecommerce-incident-platform/app/main.py)
  FastAPI app, WebSocket manager, middleware, and router registration.

- [app/services/graph_service.py](/D:/final%20year%20project/ecommerce-incident-platform/app/services/graph_service.py)
  Neo4j seeding, catalog/cart/order graph operations, and foundational graph helpers.

- [app/services/incident_service.py](/D:/final%20year%20project/ecommerce-incident-platform/app/services/incident_service.py)
  Neo4j-backed incident creation, analytics, graph snapshots, RCA context shaping, and lifecycle updates.

- [app/services/storefront_service.py](/D:/final%20year%20project/ecommerce-incident-platform/app/services/storefront_service.py)
  Storefront product, cart, checkout, and payment flow on top of Neo4j.

- [app/middleware/error_logger.py](/D:/final%20year%20project/ecommerce-incident-platform/app/middleware/error_logger.py)
  Captures exceptions, records incidents in Neo4j, and emits WebSocket alerts.

- [app/routers/shop.py](/D:/final%20year%20project/ecommerce-incident-platform/app/routers/shop.py)
  Storefront APIs for products, cart, checkout, and payment.

- [app/routers/platform.py](/D:/final%20year%20project/ecommerce-incident-platform/app/routers/platform.py)
  Incident listing, health, graph snapshot, analytics, logs, and simulation endpoints.

- [app/routers/aiops.py](/D:/final%20year%20project/ecommerce-incident-platform/app/routers/aiops.py)
  RCA, fix generation, and approval workflow APIs.

## Key Frontend Files

- [frontend/src/App.jsx](/D:/final%20year%20project/ecommerce-incident-platform/frontend/src/App.jsx)
  Route layout for storefront and `/ops`.

- [frontend/src/pages/storefront/HomePage.jsx](/D:/final%20year%20project/ecommerce-incident-platform/frontend/src/pages/storefront/HomePage.jsx)
- [frontend/src/pages/storefront/ProductPage.jsx](/D:/final%20year%20project/ecommerce-incident-platform/frontend/src/pages/storefront/ProductPage.jsx)
- [frontend/src/pages/storefront/CartPage.jsx](/D:/final%20year%20project/ecommerce-incident-platform/frontend/src/pages/storefront/CartPage.jsx)
- [frontend/src/pages/storefront/CheckoutPage.jsx](/D:/final%20year%20project/ecommerce-incident-platform/frontend/src/pages/storefront/CheckoutPage.jsx)

- [frontend/src/pages/Dashboard.jsx](/D:/final%20year%20project/ecommerce-incident-platform/frontend/src/pages/Dashboard.jsx)
- [frontend/src/pages/Incidents.jsx](/D:/final%20year%20project/ecommerce-incident-platform/frontend/src/pages/Incidents.jsx)
- [frontend/src/pages/IncidentDetail.jsx](/D:/final%20year%20project/ecommerce-incident-platform/frontend/src/pages/IncidentDetail.jsx)
- [frontend/src/pages/DependencyGraph.jsx](/D:/final%20year%20project/ecommerce-incident-platform/frontend/src/pages/DependencyGraph.jsx)
- [frontend/src/pages/LiveMonitoring.jsx](/D:/final%20year%20project/ecommerce-incident-platform/frontend/src/pages/LiveMonitoring.jsx)

## MCP Tools and Graph Reasoning

The MCP server now reads only from Neo4j.

### Main Claude-facing tools

- `search_incidents`
- `analyze_dependencies`
- `get_blast_radius`
- `get_metadata`
- `generate_rca`
- `suggest_fix`
- `approve_fix`

### Intended GraphRAG reasoning flow

For a prompt such as `Why did payment service fail?`, Claude can:

1. call `search_incidents`
2. call `analyze_dependencies`
3. call `get_blast_radius`
4. call `generate_rca`

Expected answer structure:

- Root Cause
- Evidence
- Dependency Chain
- Blast Radius
- Fix Recommendation
- Confidence Score

## Important Cypher Patterns

### Recent incidents

```cypher
MATCH (i:Incident)-[:OCCURRED_IN]->(s:Service)
OPTIONAL MATCH (i)-[:HAS_LOG]->(l:ErrorLog)
RETURN i, s, l
ORDER BY i.timestamp DESC
LIMIT 20
```

### Dependency chain for a service

```cypher
MATCH (s:Service {name: $service_name})-[:DEPENDS_ON]->(c:Component)
OPTIONAL MATCH (c)-[:MAINTAINED_BY]->(t:Team)
RETURN s.name AS service, c.name AS component, c.type AS type, t.name AS team
ORDER BY c.name
```

### Blast radius from service impacts

```cypher
MATCH (s:Service {name: $service_name})
OPTIONAL MATCH path = (s)-[:IMPACTS*1..3]->(impacted:Service)
RETURN s.name AS source, collect(DISTINCT impacted.name) AS impacted_services
```

### Incident with service, component, and log evidence

```cypher
MATCH (i:Incident {id: $incident_id})
OPTIONAL MATCH (i)-[:OCCURRED_IN]->(s:Service)
OPTIONAL MATCH (i)-[:CAUSED_BY]->(c:Component)
OPTIONAL MATCH (i)-[:HAS_LOG]->(l:ErrorLog)
RETURN i, s, c, l
```

### Service health snapshot

```cypher
MATCH (s:Service)
OPTIONAL MATCH (s)<-[:OCCURRED_IN]-(i:Incident)
WITH s, count(CASE WHEN i.status IN ['open', 'investigating', 'mitigating'] THEN 1 END) AS active_incidents
RETURN s.name, s.status, active_incidents
ORDER BY s.name
```

## API Surface

### Storefront APIs

- `GET /products`
- `GET /products/{product_id}`
- `POST /cart`
- `GET /cart/{session_id}`
- `POST /checkout`
- `POST /payment`

### Platform APIs

- `GET /health`
- `GET /api/platform/summary`
- `GET /api/platform/incidents`
- `GET /api/platform/incidents/{incident_id}`
- `PATCH /api/platform/incidents/{incident_id}`
- `GET /api/platform/logs/recent`
- `GET /api/platform/analytics/mttr`
- `GET /api/platform/health`
- `GET /api/platform/graph`
- `POST /api/platform/simulate/db-crash`
- `POST /api/platform/simulate/redis-oom`
- `POST /api/platform/simulate/api-timeout`

### AI workflow APIs

- `POST /api/ai/rca/{incident_id}`
- `POST /api/ai/fix/{incident_id}`
- `POST /api/ai/apply_fix/{incident_id}`

### WebSocket

- `WS /ws/incidents`

## Setup

### Prerequisites

- Docker Desktop
- Node.js and npm
- Python available through `uv`

### Start Neo4j

```powershell
cd "D:\final year project\ecommerce-incident-platform"
docker-compose up -d
```

This starts Neo4j only:

- Browser: [http://localhost:7474](http://localhost:7474)
- Bolt: `bolt://localhost:7687`

### Start backend

```powershell
cd "D:\final year project\ecommerce-incident-platform"
uv run uvicorn app.main:app --reload
```

### Start frontend

```powershell
cd "D:\final year project\ecommerce-incident-platform\frontend"
npm.cmd install
npm.cmd run dev
```

### App URLs

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## Environment Variables

### Required for core graph runtime

- `NEO4J_URL`
- `NEO4J_USER`
- `NEO4J_PASSWORD`

### Optional for AI and fix workflow

- `GEMINI_API_KEY`
- `GITHUB_TOKEN`
- `GITHUB_REPO`
- `GITHUB_BRANCH`

If `GEMINI_API_KEY` is not configured, fallback graph-based RCA and fix suggestions are still returned. If GitHub credentials are missing, the fix review flow still works but live PR creation will fail.

## Migration Logic

An example migration utility is included in [data/migrate_to_neo4j.py](/D:/final%20year%20project/ecommerce-incident-platform/data/migrate_to_neo4j.py).

It seeds the graph and can optionally import legacy incident rows from an older SQLite incident file into Neo4j. This script is a one-time migration helper and is not part of the normal runtime architecture.

Run it with:

```powershell
cd "D:\final year project\ecommerce-incident-platform"
uv run python data/migrate_to_neo4j.py
```

## Demo Script

### Trigger through storefront

1. Open [http://localhost:5173](http://localhost:5173).
2. Add `FlashCart Festival Bundle` to trigger cart failure, or add `Warehouse Sync Console` / `Premium Payment Test Pass` for checkout failures.
3. Proceed through cart and checkout.
4. Observe the incident in `/ops`.

### Trigger through ops demo controls

1. Open `/ops`.
2. Use `DB Crash`, `Redis OOM`, or `API Timeout`.
3. Watch the live monitoring page and graph update.

### Investigate in Claude Desktop

Ask:

- `Why did payment fail?`
- `Show the dependency chain for orders`
- `What is the blast radius for payments?`
- `Fix it`

Claude should answer using MCP tools backed only by Neo4j.

## Validation

Recommended validation commands:

```powershell
cd "D:\final year project\ecommerce-incident-platform"
uv run uvicorn app.main:app --reload
```

```powershell
cd "D:\final year project\ecommerce-incident-platform\frontend"
npm.cmd run lint
npm.cmd run build
```

```powershell
Invoke-RestMethod http://localhost:8000/api/platform/summary
Invoke-RestMethod http://localhost:8000/api/platform/graph
Invoke-RestMethod http://localhost:8000/api/platform/incidents
```

## Notes

- Redis and payment failures still exist as simulated incident scenarios, but they are no longer used as storage layers.
- Neo4j is the single operational data store for runtime reads and writes.
- The website is the trigger surface; Claude through MCP is the primary analysis surface.
- The graph page can continue to visualize services, components, and incidents directly from Neo4j-backed APIs.
