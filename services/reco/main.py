from typing import List, Dict, Any
from fastapi import FastAPI
from pydantic import BaseModel
import math

app = FastAPI(title="FreelanceLinkAI Reco Service", version="0.1.0")

class Skill(BaseModel):
    id: int
    name: str

class Freelancer(BaseModel):
    id: str
    title: str | None = None
    location: str | None = None
    ratingAvg: float = 0.0
    skills: List[Skill] = []

class Project(BaseModel):
    id: str
    title: str
    description: str
    location: str | None = None
    requiredSkills: List[Skill] = []

class RecoRequest(BaseModel):
    project: Project
    candidates: List[Freelancer]
    limit: int = 10

class RecoItem(BaseModel):
    freelancerId: str
    score: float

class RecoResponse(BaseModel):
    recommendations: List[RecoItem]


def jaccard(a: set[int], b: set[int]) -> float:
    if not a and not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 0.0

@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}

@app.post("/recommend", response_model=RecoResponse)
async def recommend(payload: RecoRequest) -> RecoResponse:
    req_ids = {s.id for s in payload.project.requiredSkills}
    recos: List[RecoItem] = []
    for f in payload.candidates:
        f_ids = {s.id for s in f.skills}
        overlap = jaccard(req_ids, f_ids)
        location_boost = 0.0
        if payload.project.location and f.location and payload.project.location.lower() == f.location.lower():
            location_boost = 0.2
        score = overlap * 2.0 + f.ratingAvg * 0.1 + location_boost
        # small length normalization to avoid bias toward too many skills
        score = score / (1.0 + 0.01 * max(0, len(f_ids) - 20))
        if score > 0:
            recos.append(RecoItem(freelancerId=f.id, score=score))
    recos.sort(key=lambda r: r.score, reverse=True)
    return RecoResponse(recommendations=recos[: payload.limit])