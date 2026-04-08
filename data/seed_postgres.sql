CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100),
    email VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    description TEXT,
    price DECIMAL(10,2),
    stock INTEGER
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id),
    status VARCHAR(50)
);

-- Seed Data
INSERT INTO users (id, username, email) VALUES
('u1', 'alice', 'alice@example.com'),
('u2', 'bob', 'bob@example.com')
ON CONFLICT DO NOTHING;

INSERT INTO products (id, name, description, price, stock) VALUES
('p1', 'Laptop', 'A high end laptop', 1200.00, 10),
('p2', 'Mouse', 'Wireless mouse', 25.00, 50),
('p3', 'Keyboard', 'Mechanical keyboard', 75.00, 1)
ON CONFLICT DO NOTHING;
