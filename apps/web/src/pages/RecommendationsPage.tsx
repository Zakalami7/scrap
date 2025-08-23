import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

type Project = { id: string; title: string };

type Recommendation = {
  freelancer: {
    id: string;
    user: { email: string; name?: string };
    title?: string;
    location?: string;
    ratingAvg: number;
    skills: { skill: { name: string } }[];
  };
  score: number;
};

export function RecommendationsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>('');
  const [recs, setRecs] = useState<Recommendation[]>([]);

  useEffect(() => {
    apiGet<Project[]>('/projects').then(setProjects);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    apiGet<Recommendation[]>(`/projects/${projectId}/recommendations?limit=10`).then(setRecs);
  }, [projectId]);

  return (
    <div>
      <h2>Recommandations</h2>
      <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
        <option value="">Choisir un projet…</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>

      <ul style={{ marginTop: 16 }}>
        {recs.map((r) => (
          <li key={r.freelancer.id} style={{ marginBottom: 12 }}>
            <strong>{r.freelancer.user.name || r.freelancer.user.email}</strong> — score {r.score.toFixed(2)}
            <div style={{ fontSize: 12, color: '#666' }}>
              {r.freelancer.title || '—'} · {r.freelancer.location || '—'} · note {r.freelancer.ratingAvg || 0}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              Compétences: {r.freelancer.skills.map((s) => s.skill.name).join(', ') || '—'}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}