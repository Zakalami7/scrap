import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../lib/api';

type Project = {
  id: string;
  title: string;
  description: string;
  company: { id: string; name: string; user: { email: string } };
  requiredSkills: { skill: { name: string } }[];
};

type User = { id: string; email: string; name?: string; role: string; freelancerProfile?: { id: string } };

type Application = {
  id: string;
  projectId: string;
  freelancerId: string;
  status: string;
  coverLetter?: string;
  freelancer?: { id: string; user: { email: string; name?: string } };
};

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');

  const [users, setUsers] = useState<User[]>([]);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);

  const load = () => {
    setLoading(true);
    Promise.all([apiGet<Project[]>('/projects'), apiGet<User[]>('/users')])
      .then(([p, u]) => {
        setProjects(p);
        setUsers(u);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setApplications([]);
      return;
    }
    apiGet<Application[]>(`/projects/${selectedProjectId}/applications`).then(setApplications);
  }, [selectedProjectId]);

  async function createProject() {
    if (!title || !description) return;
    const requiredSkills = skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
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

  async function applyToProject() {
    if (!selectedProjectId || !selectedFreelancerId) return;
    await apiPost(`/projects/${selectedProjectId}/applications`, {
      freelancerId: selectedFreelancerId,
      coverLetter: coverLetter || undefined
    });
    setCoverLetter('');
    const apps = await apiGet<Application[]>(`/projects/${selectedProjectId}/applications`);
    setApplications(apps);
  }

  async function updateApplicationStatus(id: string, status: 'PENDING' | 'ACCEPTED' | 'REJECTED') {
    await apiPatch(`/applications/${id}`, { status });
    const apps = await apiGet<Application[]>(`/projects/${selectedProjectId}/applications`);
    setApplications(apps);
    load();
  }

  const freelancers = users.filter((u) => u.role === 'FREELANCER' && u.freelancerProfile);

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

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
        <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
          <option value="">Sélectionner un projet…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <select
          value={selectedFreelancerId}
          onChange={(e) => setSelectedFreelancerId(e.target.value)}
        >
          <option value="">Sélectionner un freelance…</option>
          {freelancers.map((u) => (
            <option key={u.freelancerProfile!.id} value={u.freelancerProfile!.id}>
              {u.name || u.email}
            </option>
          ))}
        </select>
        <input
          placeholder="Message de motivation"
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          style={{ width: 260 }}
        />
        <button onClick={applyToProject} disabled={!selectedProjectId || !selectedFreelancerId}>
          Postuler
        </button>
      </div>

      {selectedProjectId && (
        <div>
          <h3>Candidatures</h3>
          {applications.length === 0 ? (
            <p>Aucune candidature pour ce projet.</p>
          ) : (
            <ul>
              {applications.map((a) => (
                <li key={a.id} style={{ marginBottom: 12 }}>
                  <strong>{a.freelancer?.user?.name || a.freelancer?.user?.email || a.freelancerId}</strong>
                  {' '}— {a.status}
                  {a.coverLetter ? ` — "${a.coverLetter}"` : ''}
                  <button style={{ marginLeft: 8 }} onClick={() => updateApplicationStatus(a.id, 'ACCEPTED')}>
                    Accepter
                  </button>
                  <button style={{ marginLeft: 8 }} onClick={() => updateApplicationStatus(a.id, 'REJECTED')}>
                    Refuser
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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