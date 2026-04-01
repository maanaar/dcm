import hashlib
import json
import os
import sqlite3
import uuid
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Request

router = APIRouter()

DB_PATH = os.getenv("CURALINK_DB_PATH", "curalink_users.db")

_ALL_PERM_IDS = [
    "dashboard", "patients", "studies", "devices",
    "app-entities", "hl7-application", "routing-rules", "transform-rules", "export-rules",
]


# ── DB helpers ────────────────────────────────────────────────────────────────

def _hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()


def _row_to_user(row) -> dict:
    return {
        "id":          row[0],
        "username":    row[1],
        "email":       row[2] if len(row) > 2 else "",
        "firstName":   row[3] if len(row) > 3 else "",
        "lastName":    row[4] if len(row) > 4 else "",
        "isAdmin":     bool(row[6]) if len(row) > 6 else False,
        "enabled":     bool(row[7]) if len(row) > 7 else True,
        "permissions": json.loads(row[8] or "[]") if len(row) > 8 else [],
    }


def init_db() -> None:
    conn = sqlite3.connect(DB_PATH)
    c    = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS curalink_users (
            id            TEXT PRIMARY KEY,
            username      TEXT UNIQUE NOT NULL,
            email         TEXT DEFAULT '',
            first_name    TEXT DEFAULT '',
            last_name     TEXT DEFAULT '',
            password_hash TEXT NOT NULL,
            is_admin      INTEGER DEFAULT 0,
            enabled       INTEGER DEFAULT 1,
            permissions   TEXT DEFAULT '[]'
        )
    """)
    # Schema migration: add any missing columns
    existing_cols = {row[1] for row in c.execute("PRAGMA table_info(curalink_users)")}
    for col, definition in [
        ("email",       "TEXT DEFAULT ''"),
        ("first_name",  "TEXT DEFAULT ''"),
        ("last_name",   "TEXT DEFAULT ''"),
        ("is_admin",    "INTEGER DEFAULT 0"),
        ("enabled",     "INTEGER DEFAULT 1"),
        ("permissions", "TEXT DEFAULT '[]'"),
    ]:
        if col not in existing_cols:
            c.execute(f"ALTER TABLE curalink_users ADD COLUMN {col} {definition}")

    # Ensure default admin exists
    c.execute("SELECT COUNT(*) FROM curalink_users WHERE username = 'admin'")
    if c.fetchone()[0] == 0:
        c.execute(
            "INSERT INTO curalink_users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), "admin", "admin@hospital.com", "Admin", "User",
             _hash_pw("admin123"), 1, 1, json.dumps(_ALL_PERM_IDS))
        )
    else:
        c.execute(
            "UPDATE curalink_users SET email = 'admin@hospital.com', enabled = 1 "
            "WHERE username = 'admin' AND (email = '' OR email IS NULL)"
        )
    conn.commit()
    conn.close()


# Initialise DB at import time
init_db()


# ── Auth ──────────────────────────────────────────────────────────────────────

@router.post("/auth/login")
async def login(request: Request):
    try:
        body     = await request.json()
        email    = (body.get("email") or body.get("username") or "").strip()
        password = body.get("password", "")
        if not email or not password:
            raise HTTPException(status_code=400, detail="Username/email and password required")
        conn = sqlite3.connect(DB_PATH)
        c    = conn.cursor()
        c.execute(
            "SELECT * FROM curalink_users WHERE (email = ? OR username = ?) AND enabled = 1",
            (email, email),
        )
        row = c.fetchone()
        conn.close()
        if not row or row[5] != _hash_pw(password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        return {"success": True, "user": _row_to_user(row)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Users CRUD ────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users():
    try:
        conn = sqlite3.connect(DB_PATH)
        c    = conn.cursor()
        c.execute("SELECT * FROM curalink_users ORDER BY username")
        rows = c.fetchall()
        conn.close()
        return [_row_to_user(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/{user_id}")
async def get_user(user_id: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        c    = conn.cursor()
        c.execute("SELECT * FROM curalink_users WHERE id = ?", (user_id,))
        row  = c.fetchone()
        conn.close()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        return _row_to_user(row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users")
async def create_user(request: Request):
    try:
        body     = await request.json()
        username = body.get("username", "").strip()
        password = body.get("password", "")
        if not username:
            raise HTTPException(status_code=400, detail="Username is required")
        if not password:
            raise HTTPException(status_code=400, detail="Password is required")
        user_id = str(uuid.uuid4())
        conn    = sqlite3.connect(DB_PATH)
        c       = conn.cursor()
        try:
            c.execute(
                "INSERT INTO curalink_users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (user_id, username,
                 body.get("email", ""),
                 body.get("firstName", ""),
                 body.get("lastName", ""),
                 _hash_pw(password),
                 1 if body.get("isAdmin") else 0,
                 1 if body.get("enabled", True) else 0,
                 json.dumps(body.get("permissions", [])))
            )
            conn.commit()
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=409, detail=f"Username '{username}' already exists")
        finally:
            conn.close()
        return {"success": True, "id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/{user_id}")
async def update_user(user_id: str, request: Request):
    try:
        body   = await request.json()
        conn   = sqlite3.connect(DB_PATH)
        c      = conn.cursor()
        c.execute("SELECT id FROM curalink_users WHERE id = ?", (user_id,))
        if not c.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="User not found")
        fields: List[str] = []
        values: list      = []
        if "email"       in body: fields.append("email = ?");        values.append(body["email"])
        if "firstName"   in body: fields.append("first_name = ?");   values.append(body["firstName"])
        if "lastName"    in body: fields.append("last_name = ?");    values.append(body["lastName"])
        if "enabled"     in body: fields.append("enabled = ?");      values.append(1 if body["enabled"] else 0)
        if "isAdmin"     in body: fields.append("is_admin = ?");     values.append(1 if body["isAdmin"] else 0)
        if "permissions" in body: fields.append("permissions = ?");  values.append(json.dumps(body["permissions"]))
        if "password"    in body and body["password"]:
            fields.append("password_hash = ?"); values.append(_hash_pw(body["password"]))
        if fields:
            values.append(user_id)
            c.execute(f"UPDATE curalink_users SET {', '.join(fields)} WHERE id = ?", values)
            conn.commit()
        conn.close()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        c    = conn.cursor()
        c.execute("DELETE FROM curalink_users WHERE id = ?", (user_id,))
        if c.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="User not found")
        conn.commit()
        conn.close()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/roles")
async def list_roles():
    return []
