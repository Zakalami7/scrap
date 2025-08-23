import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
export function RecommendationsPage() {
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState('');
    const [recs, setRecs] = useState([]);
    useEffect(() => {
        apiGet('/projects').then(setProjects);
    }, []);
    useEffect(() => {
        if (!projectId)
            return;
        apiGet(`/projects/${projectId}/recommendations?limit=10`).then(setRecs);
    }, [projectId]);
    return (_jsxs("div", { children: [_jsx("h2", { children: "Recommandations" }), _jsxs("select", { value: projectId, onChange: (e) => setProjectId(e.target.value), children: [_jsx("option", { value: "", children: "Choisir un projet\u2026" }), projects.map((p) => (_jsx("option", { value: p.id, children: p.title }, p.id)))] }), _jsx("ul", { style: { marginTop: 16 }, children: recs.map((r) => (_jsxs("li", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: r.freelancer.user.name || r.freelancer.user.email }), " \u2014 score ", r.score.toFixed(2), _jsxs("div", { style: { fontSize: 12, color: '#666' }, children: [r.freelancer.title || '—', " \u00B7 ", r.freelancer.location || '—', " \u00B7 note ", r.freelancer.ratingAvg || 0] }), _jsxs("div", { style: { fontSize: 12, color: '#666' }, children: ["Comp\u00E9tences: ", r.freelancer.skills.map((s) => s.skill.name).join(', ') || '—'] })] }, r.freelancer.id))) })] }));
}
