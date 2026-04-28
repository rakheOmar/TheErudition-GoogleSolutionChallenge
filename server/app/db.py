from __future__ import annotations

import json
import os
import sqlite3
from dataclasses import asdict
from pathlib import Path

from app.models.supply_chain import (
    Corridor,
    Edge,
    LoadProfile,
    Node,
    PolicyLayer,
    ScenarioEvent,
    Shipment,
)


class Database:
    def __init__(self, db_path: str = "supply_chain.db"):
        self._db_path = db_path
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS nodes (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS edges (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS corridors (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS load_profiles (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS policies (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS disruptions (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS shipments (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS state (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)

        conn.commit()
        conn.close()

    def save_nodes(self, nodes: dict[str, Node]):
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM nodes")
        for node in nodes.values():
            cursor.execute("INSERT INTO nodes (id, data) VALUES (?, ?)", (node.id, node.model_dump_json()))
        conn.commit()
        conn.close()

    def load_nodes(self) -> dict[str, Node]:
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, data FROM nodes")
        nodes = {}
        for row in cursor.fetchall():
            nodes[row[0]] = Node.model_validate_json(row[1])
        conn.close()
        return nodes

    def save_edges(self, edges: dict[str, Edge]):
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM edges")
        for edge in edges.values():
            cursor.execute("INSERT INTO edges (id, data) VALUES (?, ?)", (edge.id, edge.model_dump_json()))
        conn.commit()
        conn.close()

    def load_edges(self) -> dict[str, Edge]:
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, data FROM edges")
        edges = {}
        for row in cursor.fetchall():
            edges[row[0]] = Edge.model_validate_json(row[1])
        conn.close()
        return edges

    def save_corridors(self, corridors: dict[str, Corridor]):
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM corridors")
        for corridor in corridors.values():
            cursor.execute("INSERT INTO corridors (id, data) VALUES (?, ?)", (corridor.id, corridor.model_dump_json()))
        conn.commit()
        conn.close()

    def load_corridors(self) -> dict[str, Corridor]:
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, data FROM corridors")
        corridors = {}
        for row in cursor.fetchall():
            corridors[row[0]] = Corridor.model_validate_json(row[1])
        conn.close()
        return corridors

    def save_load_profiles(self, profiles: dict[str, LoadProfile]):
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM load_profiles")
        for profile in profiles.values():
            cursor.execute("INSERT INTO load_profiles (id, data) VALUES (?, ?)", (profile.id, profile.model_dump_json()))
        conn.commit()
        conn.close()

    def load_load_profiles(self) -> dict[str, LoadProfile]:
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, data FROM load_profiles")
        profiles = {}
        for row in cursor.fetchall():
            profiles[row[0]] = LoadProfile.model_validate_json(row[1])
        conn.close()
        return profiles

    def save_policies(self, policies: dict[str, PolicyLayer]):
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM policies")
        for policy in policies.values():
            cursor.execute("INSERT INTO policies (id, data) VALUES (?, ?)", (policy.id, policy.model_dump_json()))
        conn.commit()
        conn.close()

    def load_policies(self) -> dict[str, PolicyLayer]:
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, data FROM policies")
        policies = {}
        for row in cursor.fetchall():
            policies[row[0]] = PolicyLayer.model_validate_json(row[1])
        conn.close()
        return policies

    def save_disruptions(self, disruptions: dict[str, ScenarioEvent]):
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM disruptions")
        for disruption in disruptions.values():
            cursor.execute("INSERT INTO disruptions (id, data) VALUES (?, ?)", (disruption.id, disruption.model_dump_json()))
        conn.commit()
        conn.close()

    def load_disruptions(self) -> dict[str, ScenarioEvent]:
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, data FROM disruptions")
        disruptions = {}
        for row in cursor.fetchall():
            disruptions[row[0]] = ScenarioEvent.model_validate_json(row[1])
        conn.close()
        return disruptions

    def save_shipments(self, shipments: dict[str, Shipment]):
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM shipments")
        for shipment in shipments.values():
            cursor.execute("INSERT INTO shipments (id, data) VALUES (?, ?)", (shipment.id, shipment.model_dump_json()))
        conn.commit()
        conn.close()

    def load_shipments(self) -> dict[str, Shipment]:
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, data FROM shipments")
        shipments = {}
        for row in cursor.fetchall():
            shipments[row[0]] = Shipment.model_validate_json(row[1])
        conn.close()
        return shipments

    def save_state(self, key: str, value: str):
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO state (key, value) VALUES (?, ?)", (key, value))
        conn.commit()
        conn.close()

    def load_state(self, key: str) -> str | None:
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM state WHERE key = ?", (key,))
        row = cursor.fetchone()
        conn.close()
        return row[0] if row else None

    def has_data(self) -> bool:
        conn = sqlite3.connect(self._db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM nodes")
        count = cursor.fetchone()[0]
        conn.close()
        return count > 0


db = Database()