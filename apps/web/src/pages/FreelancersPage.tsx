import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

type Skill = { id: number; name: string };

type FreelancerProfile = {
  id: string;
  title?: string;
  location?: string;
  user: { id: string; name?: string; email: string };
  skills: { skill: Skill }[];
};

export function FreelancersPage() {
  const [profiles, setProfiles] = useState<FreelancerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [skill, setSkill] = useState('');

  useEffect(() => {
    setLoading(true);
    const query = skill ? `?skill=${encodeURIComponent(skill)}` : '';
    apiGet<FreelancerProfile[]>(`/freelancers${query}`)
      .then(setProfiles)
      .finally(() => setLoading(false));
  }, [skill]);

  return (
    <div>
      <h2>Freelances</h2>
      <div style={{ marginBottom: 12 }}>
        <input
          placeholder="Filtrer par compétence (ex: React)"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
        />
      </div>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <ul>
          {profiles.map((p) => (
            <li key={p.id} style={{ marginBottom: 12 }}>
              <strong>{p.user.name || p.user.email}</strong>
              {p.title ? ` — ${p.title}` : ''}
              {p.location ? ` — ${p.location}` : ''}
              <div style={{ fontSize: 12, color: '#666' }}>
                Compétences: {p.skills.map((s) => s.skill.name).join(', ') || '—'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}