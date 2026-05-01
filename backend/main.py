from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import os
from pipeline import DB_PATH, LEAGUES, run_pipeline

app = FastAPI(title="StatFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def query(sql: str, params: tuple = ()):
    if not os.path.exists(DB_PATH):
        return []
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/leagues")
def get_leagues():
    return [{"code": k, "name": v} for k, v in LEAGUES.items()]


@app.get("/standings/{league_code}")
def get_standings(league_code: str):
    rows = query(
        "SELECT * FROM standings WHERE league_code = ? ORDER BY position",
        (league_code.upper(),)
    )
    if not rows:
        raise HTTPException(status_code=404, detail="No data for this league. Run the pipeline first.")
    return rows


@app.get("/scorers/{league_code}")
def get_scorers(league_code: str):
    rows = query(
        "SELECT * FROM scorers WHERE league_code = ? ORDER BY rank",
        (league_code.upper(),)
    )
    if not rows:
        raise HTTPException(status_code=404, detail="No data for this league.")
    return rows


@app.get("/matches/{league_code}")
def get_matches(league_code: str):
    rows = query(
        """SELECT * FROM matches WHERE league_code = ?
           ORDER BY utc_date DESC LIMIT 20""",
        (league_code.upper(),)
    )
    if not rows:
        raise HTTPException(status_code=404, detail="No matches found.")
    return rows


@app.post("/pipeline/run")
def trigger_pipeline(league: str = None):
    """Manually trigger the ETL pipeline."""
    try:
        leagues = [league.upper()] if league else None
        run_pipeline(leagues)
        return {"status": "success", "message": "Pipeline completed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats/summary")
def get_summary():
    """High-level DB stats for the dashboard header."""
    standings_count = query("SELECT COUNT(*) as n FROM standings")[0]["n"]
    scorers_count = query("SELECT COUNT(*) as n FROM scorers")[0]["n"]
    matches_count = query("SELECT COUNT(*) as n FROM matches")[0]["n"]
    last_updated = query(
        "SELECT MAX(updated_at) as t FROM standings"
    )[0].get("t", "never")
    return {
        "teams_tracked": standings_count,
        "scorers_tracked": scorers_count,
        "matches_tracked": matches_count,
        "last_updated": last_updated,
    }
