import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';

type Project = {
  id: string;
  title: string;
  description: string;
  company: { id: string; name: string; user: { email: string } };
  requiredSkills: { skill: { name: string } }[];
};

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');

  const load = () => {
    setLoading(true);
    apiGet<Project[]>('/projects')
      .then(setProjects)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  async function createProject() {
    if (!title || !description) return;
    const requiredSkills = skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    // In real app we use authenticated companyId; here we assume first company
    const companies = await apiGet<any[]>('/users');
    const firstCompany = companies.find((u) => u.role === 'COMPANY' && u.company);
    if (!firstCompany) {
      alert("Aucune entreprise disponible. Créez un utilisateur 'COMPANY' via l'API.");
      return;
    }
    await apiPost('/projects', {
      companyId: firstCompany.company.id,
      title,
      description,
      requiredSkills
    });
    setTitle('');
    setDescription('');
    setSkills('');
    load();
  }

  return (
    <div>
      <h2>Projets</h2>
      <div style={{ marginBottom: 16 }}>
        <input placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ marginLeft: 8 }}
        />
        <input
          placeholder="Compétences (séparées par virgule)"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          style={{ marginLeft: 8 }}
        />
        <button onClick={createProject} style={{ marginLeft: 8 }}>
          Créer
        </button>
      </div>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <ul>
          {projects.map((p) => (
            <li key={p.id} style={{ marginBottom: 12 }}>
              <strong>{p.title}</strong> — {p.description}
              <div style={{ fontSize: 12, color: '#666' }}>
                Entreprise: {p.company?.name || p.company?.user?.email}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                Compétences requises: {p.requiredSkills.map((rs) => rs.skill.name).join(', ') || '—'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}