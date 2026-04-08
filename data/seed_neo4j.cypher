MATCH (n) DETACH DELETE n;

CREATE CONSTRAINT service_name IF NOT EXISTS FOR (n:Service) REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT component_name IF NOT EXISTS FOR (n:Component) REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT team_name IF NOT EXISTS FOR (n:Team) REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT incident_id IF NOT EXISTS FOR (n:Incident) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT errorlog_id IF NOT EXISTS FOR (n:ErrorLog) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT product_id IF NOT EXISTS FOR (n:Product) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT user_id IF NOT EXISTS FOR (n:User) REQUIRE n.id IS UNIQUE;

MERGE (platform:Team {name: 'Platform'});
MERGE (commerce:Team {name: 'Commerce'});
MERGE (billing:Team {name: 'Billing'});
MERGE (search:Team {name: 'Search'});
MERGE (supply:Team {name: 'SupplyChain'});

MERGE (api:Service {name: 'api-gateway'})
SET api.status = 'healthy', api.team = 'Platform';
MERGE (orders:Service {name: 'orders'})
SET orders.status = 'healthy', orders.team = 'Commerce';
MERGE (cart:Service {name: 'cart'})
SET cart.status = 'healthy', cart.team = 'Commerce';
MERGE (payments:Service {name: 'payments'})
SET payments.status = 'healthy', payments.team = 'Billing';
MERGE (catalog:Service {name: 'search'})
SET catalog.status = 'healthy', catalog.team = 'Search';
MERGE (inventory:Service {name: 'inventory'})
SET inventory.status = 'healthy', inventory.team = 'SupplyChain';

MERGE (storefront:Component {name: 'storefront-ui'})
SET storefront.type = 'frontend';
MERGE (cartCache:Component {name: 'cart-cache'})
SET cartCache.type = 'cache';
MERGE (checkout:Component {name: 'checkout-orchestrator'})
SET checkout.type = 'workflow';
MERGE (paymentGateway:Component {name: 'payment-gateway'})
SET paymentGateway.type = 'external-api';
MERGE (catalogIndex:Component {name: 'catalog-search'})
SET catalogIndex.type = 'search';
MERGE (inventoryEngine:Component {name: 'inventory-engine'})
SET inventoryEngine.type = 'inventory';
MERGE (neo4jCore:Component {name: 'neo4j-core'})
SET neo4jCore.type = 'graph-db';

MERGE (api)-[:OWNED_BY]->(platform);
MERGE (orders)-[:OWNED_BY]->(commerce);
MERGE (cart)-[:OWNED_BY]->(commerce);
MERGE (payments)-[:OWNED_BY]->(billing);
MERGE (catalog)-[:OWNED_BY]->(search);
MERGE (inventory)-[:OWNED_BY]->(supply);

MERGE (storefront)-[:MAINTAINED_BY]->(platform);
MERGE (cartCache)-[:MAINTAINED_BY]->(commerce);
MERGE (checkout)-[:MAINTAINED_BY]->(commerce);
MERGE (paymentGateway)-[:MAINTAINED_BY]->(billing);
MERGE (catalogIndex)-[:MAINTAINED_BY]->(search);
MERGE (inventoryEngine)-[:MAINTAINED_BY]->(supply);
MERGE (neo4jCore)-[:MAINTAINED_BY]->(platform);

MERGE (api)-[:DEPENDS_ON]->(storefront);
MERGE (orders)-[:DEPENDS_ON]->(checkout);
MERGE (orders)-[:DEPENDS_ON]->(neo4jCore);
MERGE (cart)-[:DEPENDS_ON]->(cartCache);
MERGE (cart)-[:DEPENDS_ON]->(neo4jCore);
MERGE (payments)-[:DEPENDS_ON]->(paymentGateway);
MERGE (payments)-[:DEPENDS_ON]->(neo4jCore);
MERGE (catalog)-[:DEPENDS_ON]->(catalogIndex);
MERGE (catalog)-[:DEPENDS_ON]->(neo4jCore);
MERGE (inventory)-[:DEPENDS_ON]->(inventoryEngine);
MERGE (inventory)-[:DEPENDS_ON]->(neo4jCore);

MERGE (api)-[:IMPACTS]->(orders);
MERGE (api)-[:IMPACTS]->(cart);
MERGE (api)-[:IMPACTS]->(payments);
MERGE (api)-[:IMPACTS]->(catalog);
MERGE (api)-[:IMPACTS]->(inventory);
MERGE (cart)-[:IMPACTS]->(orders);
MERGE (orders)-[:IMPACTS]->(payments);
MERGE (orders)-[:IMPACTS]->(inventory);
MERGE (payments)-[:IMPACTS]->(orders);
MERGE (inventory)-[:IMPACTS]->(orders);

MERGE (:User {id: 'u1', username: 'alice', email: 'alice@example.com'});
MERGE (:User {id: 'u2', username: 'bob', email: 'bob@example.com'});

MERGE (:Product {
  id: 'sku-phone',
  name: 'Nebula X Pro Smartphone',
  description: 'Flagship camera, 120Hz AMOLED display, and all-day battery life.',
  price: 54999.0,
  category: 'Mobiles',
  rating: 4.7,
  stock: 18,
  badge: 'Best Seller',
  failure_mode: ''
});
MERGE (:Product {
  id: 'sku-laptop',
  name: 'AetherBook 14 Laptop',
  description: 'Lightweight productivity laptop built for hybrid work and creators.',
  price: 72990.0,
  category: 'Laptops',
  rating: 4.6,
  stock: 9,
  badge: 'Top Rated',
  failure_mode: ''
});
MERGE (:Product {
  id: 'sku-redis-demo',
  name: 'FlashCart Festival Bundle',
  description: 'A promo pack used to simulate a cart-cache failure during add-to-cart.',
  price: 1999.0,
  category: 'Promo',
  rating: 4.2,
  stock: 50,
  badge: 'Chaos Demo',
  failure_mode: 'redis'
});
MERGE (:Product {
  id: 'sku-db-demo',
  name: 'Warehouse Sync Console',
  description: 'A demo SKU that forces an order-write failure during checkout.',
  price: 12999.0,
  category: 'Gaming',
  rating: 4.3,
  stock: 6,
  badge: 'Chaos Demo',
  failure_mode: 'db'
});
MERGE (:Product {
  id: 'sku-payment-demo',
  name: 'Premium Payment Test Pass',
  description: 'A checkout item that intentionally triggers a payment timeout path.',
  price: 499.0,
  category: 'Services',
  rating: 4.0,
  stock: 100,
  badge: 'Chaos Demo',
  failure_mode: 'payment'
});
