# StatFlow

Automated soccer statistics pipeline with a live dashboard. Ingests data from 4 major European leagues, transforms it, stores it in SQLite, and serves it through a REST API to a React frontend.

## Live Demo

[http://3.14.146.94/statflow/](http://3.14.146.94/statflow/)

## Features

- **ETL Pipeline** — fetches standings, top scorers, and recent matches from the football-data.org API
- **4 Leagues** — Premier League, La Liga, Bundesliga, Serie A
- **Automated** — cron job runs the pipeline nightly at 2am UTC
- **REST API** — FastAPI serving cleaned data as JSON
- **Live Dashboard** — React frontend with bar charts, sortable tables, and team crests

## Tech Stack

| Layer | Technology |
|---|---|
| Data ingestion | Python, requests |
| Transformation | pandas |
| Storage | SQLite |
| Scheduling | cron |
| API | FastAPI, uvicorn |
| Frontend | React, TypeScript, Recharts |
| Deployment | AWS EC2, nginx |

## Project Structure

```
statflow/
├── backend/
│   ├── pipeline.py     # ETL — fetch, transform, load
│   ├── main.py         # FastAPI — serves data endpoints
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.tsx
        └── components/
            ├── Standings.tsx
            ├── Scorers.tsx
            └── Matches.tsx
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /standings/{league}` | League table |
| `GET /scorers/{league}` | Top scorers |
| `GET /matches/{league}` | Recent results |
| `GET /leagues` | Available leagues |
| `GET /stats/summary` | Pipeline stats |
| `POST /pipeline/run` | Manually trigger ETL |

League codes: `PL`, `PD`, `BL1`, `SA`

## Setup

```bash
git clone https://github.com/DanielAguilar112/statflow.git
cd statflow/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

export FOOTBALL_API_KEY=your_key_here  # get free key at football-data.org
python pipeline.py   # run pipeline once
uvicorn main:app --reload --port 8001
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Data Source

[football-data.org](https://www.football-data.org) — free tier API covering major European leagues.
