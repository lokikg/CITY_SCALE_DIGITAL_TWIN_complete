"""
API endpoints for database testing and inspection
Allows the testing UI to test database connectivity, execute queries, and inspect schema
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import time
import os
from dotenv import load_dotenv

load_dotenv()

database_test_router = APIRouter(prefix="/api/tests/database", tags=["database-testing"])

# Detect whether MongoDB should be used
DB_TYPE = os.getenv("DB_TYPE", os.getenv("DATABASE_TYPE", "")) or os.getenv("REACT_APP_DB_TYPE")
MONGODB_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
# Some deployments might put a mongodb:// URL in DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")
if not MONGODB_URI and DATABASE_URL and DATABASE_URL.startswith("mongodb"):
    MONGODB_URI = DATABASE_URL

USE_MONGODB = (str(DB_TYPE).lower() == 'mongodb') or (MONGODB_URI is not None)

if USE_MONGODB:
    try:
        from pymongo import MongoClient, errors as pymongo_errors

        MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", os.getenv("DATABASE_NAME", "city_iot"))
        mongo_client = MongoClient(MONGODB_URI or "mongodb://localhost:27017", serverSelectionTimeoutMS=3000)
        mongo_db = mongo_client[MONGO_DB_NAME]
    except Exception:
        mongo_client = None
        mongo_db = None
else:
    # Keep SQLAlchemy-based code as a fallback for projects still using SQL
    from sqlalchemy import text, inspect, create_engine
    from sqlalchemy.exc import SQLAlchemyError
    from sqlalchemy.orm import sessionmaker

    # Create synchronous engine for testing
    DATABASE_URL_SQL = DATABASE_URL or os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/city_iot")
    if "+asyncpg" in DATABASE_URL_SQL:
        DATABASE_URL_SQL = DATABASE_URL_SQL.replace("+asyncpg", "")

    sync_engine = create_engine(DATABASE_URL_SQL, echo=False)
    SessionLocal = sessionmaker(bind=sync_engine)

    from models import (
        TrafficSensor, AirQualitySensor, NoiseSensor, WeatherStation,
        SmartMeter, WasteBin, ParkingSensor, StreetLight,
        PublicTransportTracker, SurveillanceCamera, WaterQualitySensor,
        EnergyGridSensor
    )


# Request/Response Models
class ConnectionTestRequest(BaseModel):
    host: Optional[str] = None
    port: Optional[int] = None
    name: Optional[str] = None
    user: Optional[str] = None
    password: Optional[str] = None
    ssl: bool = False


class QueryRequest(BaseModel):
    query: str
    params: Optional[List[Any]] = []
    readOnly: bool = True


class PerformanceTestRequest(BaseModel):
    query: str
    iterations: int = 3


class TableInfo(BaseModel):
    name: str
    columns: List[Dict[str, Any]]
    rowCount: int


def simple_sql_to_mongo(query: str):
    """
    Very small SQL->Mongo parser for common test patterns used by the UI.
    Supports:
      - SELECT * FROM <collection> LIMIT n
      - SELECT COUNT(*) FROM <collection>
      - EXPLAIN ANALYZE SELECT ... LIMIT n  (maps to collection.find(...).limit(n).explain())
    Returns a dict: { type: 'find'|'count'|'explain', collection: str, filter: dict, limit: int }
    """
    q = query.strip()
    ql = q.lower()
    import re

    # COUNT
    m = re.match(r"select\s+count\s*\(\s*\*\s*\)\s+from\s+([a-z0-9_]+)", ql)
    if m:
        return {"type": "count", "collection": m.group(1)}

    # SELECT * FROM <collection> LIMIT n
    m = re.match(r"select\s+\*\s+from\s+([a-z0-9_]+)(?:\s+limit\s+(\d+))?", ql)
    if m:
        coll = m.group(1)
        limit = int(m.group(2)) if m.group(2) else 10
        return {"type": "find", "collection": coll, "filter": {}, "limit": limit}

    # EXPLAIN ... SELECT * FROM <collection> LIMIT n
    m = re.match(r"explain.*select\s+\*\s+from\s+([a-z0-9_]+)(?:\s+limit\s+(\d+))?", ql)
    if m:
        coll = m.group(1)
        limit = int(m.group(2)) if m.group(2) else 10
        return {"type": "explain", "collection": coll, "filter": {}, "limit": limit}

    return None


def serialize_mongo_doc(doc):
    """Convert Mongo document to JSON-friendly dict"""
    from bson import json_util

    try:
        return json_util.loads(json_util.dumps(doc))
    except Exception:
        # Fallback: convert to dict and stringify ObjectId
        result = {}
        for k, v in dict(doc).items():
            try:
                result[k] = v
            except Exception:
                result[k] = str(v)
        return result


@database_test_router.post("/connection")
async def test_connection(request: ConnectionTestRequest):
    """Test database connection with provided credentials (supports MongoDB or SQL fallback)"""
    if USE_MONGODB:
        try:
            if mongo_client is None:
                raise HTTPException(status_code=500, detail="Mongo client not initialized")
            # Ping the server
            mongo_client.admin.command('ping')
            return {"success": True, "message": "MongoDB connection successful", "connected": True, "timestamp": time.time()}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"MongoDB connection failed: {e}")
    else:
        try:
            db = SessionLocal()
            result = db.execute(text("SELECT 1 as test"))
            test_value = result.scalar()
            db.close()
            if test_value == 1:
                return {"success": True, "message": "Database connection successful", "connected": True, "timestamp": time.time()}
            else:
                return {"success": False, "message": "Connection test failed", "connected": False, "timestamp": time.time()}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")


@database_test_router.post("/query")
async def execute_query(request: QueryRequest):
    """Execute a simple query against MongoDB (or SQL fallback). UI may send SQL-like strings; we translate common patterns."""
    if USE_MONGODB:
        if mongo_db is None:
            raise HTTPException(status_code=500, detail="MongoDB not configured")

        q = request.query.strip()
        # If query is JSON, try to parse as a direct find payload
        import json
        try:
            if q.startswith('{') or q.startswith('['):
                payload = json.loads(q)
                # Expected payload: { "collection": "traffic_sensors", "filter": {...}, "limit": 10 }
                coll = payload.get('collection')
                filt = payload.get('filter', {})
                proj = payload.get('projection')
                limit = int(payload.get('limit', 10))
                cursor = mongo_db[coll].find(filt, projection=proj).limit(limit)
                rows = [serialize_mongo_doc(d) for d in cursor]
                return {"success": True, "rows": rows, "rowCount": len(rows), "fields": list(rows[0].keys()) if rows else [], "query": request.query}
        except Exception:
            # fallthrough to SQL-like parser
            pass

        parsed = simple_sql_to_mongo(q)
        if not parsed:
            raise HTTPException(status_code=400, detail="Unsupported query format for MongoDB. Use JSON payload or simple SELECT/COUNT patterns.")

        coll = parsed['collection']
        try:
            if parsed['type'] == 'count':
                count = mongo_db[coll].count_documents({})
                return {"success": True, "rows": [], "rowCount": count, "fields": [], "query": request.query}

            if parsed['type'] == 'find':
                cursor = mongo_db[coll].find(parsed.get('filter', {})).limit(parsed.get('limit', 10))
                rows = [serialize_mongo_doc(d) for d in cursor]
                return {"success": True, "rows": rows, "rowCount": len(rows), "fields": list(rows[0].keys()) if rows else [], "query": request.query}

            if parsed['type'] == 'explain':
                # Return explain output
                cursor = mongo_db[coll].find(parsed.get('filter', {})).limit(parsed.get('limit', 10))
                explain = cursor.explain()
                return {"success": True, "rows": [explain], "rowCount": 1, "fields": list(explain.keys()), "query": request.query}

        except Exception as e:
            raise HTTPException(status_code=400, detail=f"MongoDB query execution error: {e}")

    else:
        # SQL fallback (existing behavior)
        try:
            query_lower = request.query.lower().strip()
            if not query_lower.startswith(('select', 'show', 'describe', 'explain')):
                if request.readOnly:
                    raise HTTPException(status_code=400, detail="Only SELECT/SHOW/DESCRIBE/EXPLAIN allowed in read-only mode")

            db = SessionLocal()
            start_time = time.time()
            result = db.execute(text(request.query), request.params or {})
            execution_time = (time.time() - start_time) * 1000
            rows = []
            fields = []
            if result.returns_rows:
                rows_data = result.fetchall()
                # serialize
                for row in rows_data:
                    if hasattr(row, '_mapping'):
                        rows.append(dict(row._mapping))
                    else:
                        rows.append(dict(row))
                if rows_data and hasattr(rows_data[0], '_mapping'):
                    fields = list(rows_data[0]._mapping.keys())
            db.close()
            return {"success": True, "rows": rows, "rowCount": len(rows), "fields": fields, "executionTime": round(execution_time, 2), "query": request.query}
        except SQLAlchemyError as e:
            raise HTTPException(status_code=400, detail=f"Query execution error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@database_test_router.get("/schema")
async def get_schema():
    """Return database schema information. For MongoDB return collections and sample keys."""
    if USE_MONGODB:
        if mongo_db is None:
            raise HTTPException(status_code=500, detail="MongoDB not configured")
        try:
            collections = mongo_db.list_collection_names()
            tables = []
            for coll in collections:
                sample = mongo_db[coll].find_one() or {}
                columns = [{"name": k, "type": type(v).__name__} for k, v in dict(sample).items()]
                tables.append({"name": coll, "columns": columns})
            return {"success": True, "tables": tables, "tableCount": len(tables)}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error retrieving MongoDB schema: {e}")
    else:
        try:
            inspector = inspect(sync_engine)
            table_names = inspector.get_table_names()
            tables = []
            for table_name in table_names:
                columns = inspector.get_columns(table_name)
                tables.append({
                    "name": table_name,
                    "columns": [
                        {"name": col["name"], "type": str(col["type"]), "nullable": col.get("nullable", True), "default": str(col.get("default")) if col.get("default") else None}
                        for col in columns
                    ]
                })
            return {"success": True, "tables": tables, "tableCount": len(tables)}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error retrieving schema: {str(e)}")


@database_test_router.get("/tables/{table_name}")
async def get_table_info(table_name: str):
    if USE_MONGODB:
        if mongo_db is None:
            raise HTTPException(status_code=500, detail="MongoDB not configured")
        try:
            if table_name not in mongo_db.list_collection_names():
                raise HTTPException(status_code=404, detail=f"Collection '{table_name}' not found")
            sample = mongo_db[table_name].find_one() or {}
            columns = [{"name": k, "type": type(v).__name__} for k, v in dict(sample).items()]
            count = mongo_db[table_name].count_documents({})
            return {"success": True, "tableName": table_name, "columns": columns, "rowCount": count}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error retrieving collection info: {e}")
    else:
        try:
            inspector = inspect(sync_engine)
            if table_name not in inspector.get_table_names():
                raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
            columns = inspector.get_columns(table_name)
            primary_keys = inspector.get_pk_constraint(table_name)
            foreign_keys = inspector.get_foreign_keys(table_name)
            indexes = inspector.get_indexes(table_name)
            db = SessionLocal()
            result = db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
            row_count = result.scalar()
            db.close()
            return {"success": True, "tableName": table_name, "columns": [{"name": col["name"], "type": str(col["type"])} for col in columns], "primaryKey": primary_keys.get("constrained_columns", []), "foreignKeys": foreign_keys, "indices": indexes, "rowCount": row_count}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error retrieving table info: {str(e)}")


@database_test_router.post("/performance")
async def test_performance(request: PerformanceTestRequest):
    if USE_MONGODB:
        if mongo_db is None:
            raise HTTPException(status_code=500, detail="MongoDB not configured")
        parsed = simple_sql_to_mongo(request.query)
        if not parsed or parsed.get('type') not in ('find', 'explain'):
            raise HTTPException(status_code=400, detail="Unsupported query for MongoDB performance test")
        coll = parsed['collection']
        results = []
        total_time = 0
        try:
            for i in range(request.iterations):
                start = time.time()
                cursor = mongo_db[coll].find(parsed.get('filter', {})).limit(parsed.get('limit', 10))
                list(cursor)
                exec_time = (time.time() - start) * 1000
                total_time += exec_time
                results.append({"iteration": i + 1, "executionTime": round(exec_time, 2)})
            avg = total_time / request.iterations
            return {"success": True, "query": request.query, "iterations": request.iterations, "averageTime": round(avg, 2), "minTime": min(r['executionTime'] for r in results), "maxTime": max(r['executionTime'] for r in results), "results": results}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"MongoDB performance test error: {e}")
    else:
        try:
            query_lower = request.query.lower().strip()
            if not query_lower.startswith(('select', 'show', 'describe', 'explain')):
                raise HTTPException(status_code=400, detail="Only SELECT queries are allowed for performance testing")
            results = []
            total_time = 0
            for i in range(request.iterations):
                db = SessionLocal()
                start_time = time.time()
                result = db.execute(text(request.query))
                if result.returns_rows:
                    result.fetchall()
                exec_time = (time.time() - start_time) * 1000
                total_time += exec_time
                results.append({"iteration": i + 1, "executionTime": round(exec_time, 2)})
                db.close()
            average_time = total_time / request.iterations
            return {"success": True, "query": request.query, "iterations": request.iterations, "averageTime": round(average_time, 2), "minTime": min(r['executionTime'] for r in results), "maxTime": max(r['executionTime'] for r in results), "results": results}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Performance test error: {str(e)}")


@database_test_router.get("/status")
async def get_database_status():
    if USE_MONGODB:
        try:
            if mongo_client is None:
                raise HTTPException(status_code=500, detail="MongoDB client not initialized")
            mongo_client.admin.command('ping')
            stats = {}
            try:
                collections = mongo_db.list_collection_names()
                for c in collections:
                    try:
                        stats[c] = mongo_db[c].count_documents({})
                    except Exception:
                        stats[c] = 0
            except Exception:
                stats = {}
            return {"success": True, "status": "online", "connected": True, "tableStats": stats, "totalRecords": sum(stats.values()) if stats else 0, "timestamp": time.time()}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"MongoDB status error: {e}")
    else:
        try:
            db = SessionLocal()
            db.execute(text("SELECT 1"))
            table_stats = {}
            models = [
                ("traffic_sensors", TrafficSensor),
                ("air_quality_sensors", AirQualitySensor),
                ("noise_sensors", NoiseSensor),
                ("weather_stations", WeatherStation),
                ("smart_meters", SmartMeter),
                ("waste_bins", WasteBin),
                ("parking_sensors", ParkingSensor),
                ("street_lights", StreetLight),
                ("public_transport_trackers", PublicTransportTracker),
                ("surveillance_cameras", SurveillanceCamera),
                ("water_quality_sensors", WaterQualitySensor),
                ("energy_grid_sensors", EnergyGridSensor),
            ]
            for table_name, model in models:
                try:
                    count = db.query(model).count()
                    table_stats[table_name] = count
                except Exception:
                    table_stats[table_name] = 0
            db.close()
            return {"success": True, "status": "online", "connected": True, "tableStats": table_stats, "totalRecords": sum(table_stats.values()), "timestamp": time.time()}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database status check failed: {str(e)}")
