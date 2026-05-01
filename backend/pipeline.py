import requests
import pandas as pd
import sqlite3
import os
from datetime import datetime

API_KEY = os.environ.get("FOOTBALL_API_KEY", "1d435f9a7b40470aa908826fe9226500")
BASE_URL = "https://api.football-data.org/v4"
DB_PATH = os.path.join(os.path.dirname(__file__), "statflow.db")

HEADERS = {"X-Auth-Token": API_KEY}

LEAGUES = {
    "PL":  "Premier League",
    "PD":  "La Liga",
    "BL1": "Bundesliga",
    "SA":  "Serie A",
    "FL1": "Ligue 1",
    "CL":  "Champions League",
}


def get_db():
    return sqlite3.connect(DB_PATH)


def init_db():
    conn = get_db()
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS standings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            league_code TEXT,
            league_name TEXT,
            season TEXT,
            position INTEGER,
            team_id INTEGER,
            team_name TEXT,
            team_crest TEXT,
            played INTEGER,
            won INTEGER,
            draw INTEGER,
            lost INTEGER,
            goals_for INTEGER,
            goals_against INTEGER,
            goal_difference INTEGER,
            points INTEGER,
            form TEXT,
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS scorers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            league_code TEXT,
            league_name TEXT,
            season TEXT,
            rank INTEGER,
            player_id INTEGER,
            player_name TEXT,
            nationality TEXT,
            team_name TEXT,
            team_crest TEXT,
            goals INTEGER,
            assists INTEGER,
            penalties INTEGER,
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            league_code TEXT,
            match_id INTEGER UNIQUE,
            utc_date TEXT,
            status TEXT,
            matchday INTEGER,
            home_team TEXT,
            home_crest TEXT,
            away_team TEXT,
            away_crest TEXT,
            home_score INTEGER,
            away_score INTEGER,
            updated_at TEXT
        );
    """)
    conn.commit()
    conn.close()


def fetch_standings(league_code: str):
    url = f"{BASE_URL}/competitions/{league_code}/standings"
    r = requests.get(url, headers=HEADERS, timeout=15)
    if r.status_code != 200:
        print(f"  [standings] {league_code} failed: {r.status_code}")
        return None
    return r.json()


def fetch_scorers(league_code: str):
    url = f"{BASE_URL}/competitions/{league_code}/scorers?limit=20"
    r = requests.get(url, headers=HEADERS, timeout=15)
    if r.status_code != 200:
        print(f"  [scorers] {league_code} failed: {r.status_code}")
        return None
    return r.json()


def fetch_matches(league_code: str):
    url = f"{BASE_URL}/competitions/{league_code}/matches?status=FINISHED&limit=20"
    r = requests.get(url, headers=HEADERS, timeout=15)
    if r.status_code != 200:
        print(f"  [matches] {league_code} failed: {r.status_code}")
        return None
    return r.json()


def upsert_standings(league_code: str, data: dict):
    if not data or "standings" not in data:
        return
    league_name = LEAGUES.get(league_code, league_code)
    season = str(data.get("season", {}).get("startDate", "")[:4])
    now = datetime.utcnow().isoformat()
    rows = []
    for group in data["standings"]:
        if group.get("type") != "TOTAL":
            continue
        for entry in group["table"]:
            rows.append({
                "league_code": league_code,
                "league_name": league_name,
                "season": season,
                "position": entry.get("position"),
                "team_id": entry["team"]["id"],
                "team_name": entry["team"]["name"],
                "team_crest": entry["team"].get("crest", ""),
                "played": entry.get("playedGames"),
                "won": entry.get("won"),
                "draw": entry.get("draw"),
                "lost": entry.get("lost"),
                "goals_for": entry.get("goalsFor"),
                "goals_against": entry.get("goalsAgainst"),
                "goal_difference": entry.get("goalDifference"),
                "points": entry.get("points"),
                "form": entry.get("form", ""),
                "updated_at": now,
            })
    if not rows:
        return
    df = pd.DataFrame(rows)
    conn = get_db()
    conn.execute("DELETE FROM standings WHERE league_code = ?", (league_code,))
    df.to_sql("standings", conn, if_exists="append", index=False)
    conn.commit()
    conn.close()
    print(f"  [standings] {league_name}: {len(rows)} teams saved")


def upsert_scorers(league_code: str, data: dict):
    if not data or "scorers" not in data:
        return
    league_name = LEAGUES.get(league_code, league_code)
    season = str(data.get("season", {}).get("startDate", "")[:4])
    now = datetime.utcnow().isoformat()
    rows = []
    for i, s in enumerate(data["scorers"], 1):
        rows.append({
            "league_code": league_code,
            "league_name": league_name,
            "season": season,
            "rank": i,
            "player_id": s["player"]["id"],
            "player_name": s["player"]["name"],
            "nationality": s["player"].get("nationality", ""),
            "team_name": s.get("team", {}).get("name", ""),
            "team_crest": s.get("team", {}).get("crest", ""),
            "goals": s.get("goals", 0),
            "assists": s.get("assists", 0),
            "penalties": s.get("penalties", 0),
            "updated_at": now,
        })
    if not rows:
        return
    df = pd.DataFrame(rows)
    conn = get_db()
    conn.execute("DELETE FROM scorers WHERE league_code = ?", (league_code,))
    df.to_sql("scorers", conn, if_exists="append", index=False)
    conn.commit()
    conn.close()
    print(f"  [scorers] {league_name}: {len(rows)} scorers saved")


def upsert_matches(league_code: str, data: dict):
    if not data or "matches" not in data:
        return
    now = datetime.utcnow().isoformat()
    rows = []
    for m in data["matches"]:
        score = m.get("score", {}).get("fullTime", {})
        rows.append({
            "league_code": league_code,
            "match_id": m["id"],
            "utc_date": m.get("utcDate", ""),
            "status": m.get("status", ""),
            "matchday": m.get("matchday"),
            "home_team": m["homeTeam"]["name"],
            "home_crest": m["homeTeam"].get("crest", ""),
            "away_team": m["awayTeam"]["name"],
            "away_crest": m["awayTeam"].get("crest", ""),
            "home_score": score.get("home"),
            "away_score": score.get("away"),
            "updated_at": now,
        })
    if not rows:
        return
    df = pd.DataFrame(rows)
    conn = get_db()
    for _, row in df.iterrows():
        conn.execute("""
            INSERT OR REPLACE INTO matches
            (league_code, match_id, utc_date, status, matchday,
             home_team, home_crest, away_team, away_crest,
             home_score, away_score, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            row.league_code, row.match_id, row.utc_date, row.status,
            row.matchday, row.home_team, row.home_crest,
            row.away_team, row.away_crest,
            row.home_score, row.away_score, row.updated_at,
        ))
    conn.commit()
    conn.close()
    print(f"  [matches] {league_code}: {len(rows)} matches saved")


def run_pipeline(leagues=None):
    print(f"\n=== StatFlow pipeline started at {datetime.utcnow().isoformat()} ===")
    init_db()
    targets = leagues or list(LEAGUES.keys())
    for code in targets:
        print(f"\nProcessing {LEAGUES.get(code, code)}...")
        try:
            standings_data = fetch_standings(code)
            if standings_data:
                upsert_standings(code, standings_data)

            scorers_data = fetch_scorers(code)
            if scorers_data:
                upsert_scorers(code, scorers_data)

            matches_data = fetch_matches(code)
            if matches_data:
                upsert_matches(code, matches_data)

        except Exception as e:
            print(f"  ERROR processing {code}: {e}")

    print(f"\n=== Pipeline complete ===\n")


if __name__ == "__main__":
    run_pipeline()
