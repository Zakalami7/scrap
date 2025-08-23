import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
export function FreelancersPage() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [skill, setSkill] = useState('');
    useEffect(() => {
        setLoading(true);
        const query = skill ? `?skill=${encodeURIComponent(skill)}` : '';
        apiGet(`/freelancers${query}`)
            .then(setProfiles)
            .finally(() => setLoading(false));
    }, [skill]);
    return (_jsxs("div", { children: [_jsx("h2", { children: "Freelances" }), _jsx("div", { style: { marginBottom: 12 }, children: _jsx("input", { placeholder: "Filtrer par comp\u00E9tence (ex: React)", value: skill, onChange: (e) => setSkill(e.target.value) }) }), loading ? (_jsx("p", { children: "Chargement..." })) : (_jsx("ul", { children: profiles.map((p) => (_jsxs("li", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: p.user.name || p.user.email }), p.title ? ` — ${p.title}` : '', p.location ? ` — ${p.location}` : '', _jsxs("div", { style: { fontSize: 12, color: '#666' }, children: ["Comp\u00E9tences: ", p.skills.map((s) => s.skill.name).join(', ') || '—'] })] }, p.id))) }))] }));
}
