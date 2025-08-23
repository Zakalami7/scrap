# Reco Service (FastAPI)

## Setup
```
cd services/reco
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run
```
uvicorn main:app --reload --port 8000
```

## API
- GET /health
- POST /recommend
  - body: { project, candidates, limit }
  - returns: { recommendations: [{ freelancerId, score }] }