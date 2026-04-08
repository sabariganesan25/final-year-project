import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

def get_neo4j_driver():
    return GraphDatabase.driver(
        os.environ.get("NEO4J_URL", "bolt://localhost:7687"),
        auth=(os.environ.get("NEO4J_USER", "neo4j"), os.environ.get("NEO4J_PASSWORD", "password"))
    )
