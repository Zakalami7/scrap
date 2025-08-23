import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../lib/api';
export function ProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [skills, setSkills] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedFreelancerId, setSelectedFreelancerId] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [applications, setApplications] = useState([]);
    const load = () => {
        setLoading(true);
        Promise.all([apiGet('/projects'), apiGet('/users')])
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
        apiGet(`/projects/${selectedProjectId}/applications`).then(setApplications);
    }, [selectedProjectId]);
    async function createProject() {
        if (!title || !description)
            return;
        const requiredSkills = skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        const companies = await apiGet('/users');
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
        if (!selectedProjectId || !selectedFreelancerId)
            return;
        await apiPost(`/projects/${selectedProjectId}/applications`, {
            freelancerId: selectedFreelancerId,
            coverLetter: coverLetter || undefined
        });
        setCoverLetter('');
        const apps = await apiGet(`/projects/${selectedProjectId}/applications`);
        setApplications(apps);
    }
    async function updateApplicationStatus(id, status) {
        await apiPatch(`/applications/${id}`, { status });
        const apps = await apiGet(`/projects/${selectedProjectId}/applications`);
        setApplications(apps);
        load();
    }
    const freelancers = users.filter((u) => u.role === 'FREELANCER' && u.freelancerProfile);
    return (_jsxs("div", { children: [_jsx("h2", { children: "Projets" }), _jsxs("div", { style: { marginBottom: 16 }, children: [_jsx("input", { placeholder: "Titre", value: title, onChange: (e) => setTitle(e.target.value) }), _jsx("input", { placeholder: "Description", value: description, onChange: (e) => setDescription(e.target.value), style: { marginLeft: 8 } }), _jsx("input", { placeholder: "Comp\u00E9tences (s\u00E9par\u00E9es par virgule)", value: skills, onChange: (e) => setSkills(e.target.value), style: { marginLeft: 8 } }), _jsx("button", { onClick: createProject, style: { marginLeft: 8 }, children: "Cr\u00E9er" })] }), _jsxs("div", { style: { display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }, children: [_jsxs("select", { value: selectedProjectId, onChange: (e) => setSelectedProjectId(e.target.value), children: [_jsx("option", { value: "", children: "S\u00E9lectionner un projet\u2026" }), projects.map((p) => (_jsx("option", { value: p.id, children: p.title }, p.id)))] }), _jsxs("select", { value: selectedFreelancerId, onChange: (e) => setSelectedFreelancerId(e.target.value), children: [_jsx("option", { value: "", children: "S\u00E9lectionner un freelance\u2026" }), freelancers.map((u) => (_jsx("option", { value: u.freelancerProfile.id, children: u.name || u.email }, u.freelancerProfile.id)))] }), _jsx("input", { placeholder: "Message de motivation", value: coverLetter, onChange: (e) => setCoverLetter(e.target.value), style: { width: 260 } }), _jsx("button", { onClick: applyToProject, disabled: !selectedProjectId || !selectedFreelancerId, children: "Postuler" })] }), selectedProjectId && (_jsxs("div", { children: [_jsx("h3", { children: "Candidatures" }), applications.length === 0 ? (_jsx("p", { children: "Aucune candidature pour ce projet." })) : (_jsx("ul", { children: applications.map((a) => (_jsxs("li", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: a.freelancer?.user?.name || a.freelancer?.user?.email || a.freelancerId }), ' ', "\u2014 ", a.status, a.coverLetter ? ` — "${a.coverLetter}"` : '', _jsx("button", { style: { marginLeft: 8 }, onClick: () => updateApplicationStatus(a.id, 'ACCEPTED'), children: "Accepter" }), _jsx("button", { style: { marginLeft: 8 }, onClick: () => updateApplicationStatus(a.id, 'REJECTED'), children: "Refuser" })] }, a.id))) }))] })), loading ? (_jsx("p", { children: "Chargement..." })) : (_jsx("ul", { children: projects.map((p) => (_jsxs("li", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: p.title }), " \u2014 ", p.description, _jsxs("div", { style: { fontSize: 12, color: '#666' }, children: ["Entreprise: ", p.company?.name || p.company?.user?.email] }), _jsxs("div", { style: { fontSize: 12, color: '#666' }, children: ["Comp\u00E9tences requises: ", p.requiredSkills.map((rs) => rs.skill.name).join(', ') || '—'] })] }, p.id))) }))] }));
}
