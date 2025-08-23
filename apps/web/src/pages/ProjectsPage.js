import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';
export function ProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [skills, setSkills] = useState('');
    const load = () => {
        setLoading(true);
        apiGet('/projects')
            .then(setProjects)
            .finally(() => setLoading(false));
    };
    useEffect(() => {
        load();
    }, []);
    async function createProject() {
        if (!title || !description)
            return;
        const requiredSkills = skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        // In real app we use authenticated companyId; here we assume first company
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
    return (_jsxs("div", { children: [_jsx("h2", { children: "Projets" }), _jsxs("div", { style: { marginBottom: 16 }, children: [_jsx("input", { placeholder: "Titre", value: title, onChange: (e) => setTitle(e.target.value) }), _jsx("input", { placeholder: "Description", value: description, onChange: (e) => setDescription(e.target.value), style: { marginLeft: 8 } }), _jsx("input", { placeholder: "Comp\u00E9tences (s\u00E9par\u00E9es par virgule)", value: skills, onChange: (e) => setSkills(e.target.value), style: { marginLeft: 8 } }), _jsx("button", { onClick: createProject, style: { marginLeft: 8 }, children: "Cr\u00E9er" })] }), loading ? (_jsx("p", { children: "Chargement..." })) : (_jsx("ul", { children: projects.map((p) => (_jsxs("li", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: p.title }), " \u2014 ", p.description, _jsxs("div", { style: { fontSize: 12, color: '#666' }, children: ["Entreprise: ", p.company?.name || p.company?.user?.email] }), _jsxs("div", { style: { fontSize: 12, color: '#666' }, children: ["Comp\u00E9tences requises: ", p.requiredSkills.map((rs) => rs.skill.name).join(', ') || '—'] })] }, p.id))) }))] }));
}
