import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { apiPost } from '../lib/api';
import { setToken } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
export function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('FREELANCER');
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        try {
            const res = await apiPost(`/auth/register`, { email, password, name: name || undefined, role });
            setToken(res.token);
            navigate('/');
        }
        catch (e) {
            setError(e.message || 'Erreur');
        }
    }
    return (_jsxs("form", { onSubmit: onSubmit, style: { maxWidth: 360 }, children: [_jsx("h2", { children: "Cr\u00E9er un compte" }), _jsx("input", { placeholder: "Nom", value: name, onChange: (e) => setName(e.target.value) }), _jsx("input", { placeholder: "Email", value: email, onChange: (e) => setEmail(e.target.value) }), _jsx("input", { placeholder: "Mot de passe", type: "password", value: password, onChange: (e) => setPassword(e.target.value) }), _jsxs("select", { value: role, onChange: (e) => setRole(e.target.value), children: [_jsx("option", { value: "FREELANCER", children: "Freelance" }), _jsx("option", { value: "COMPANY", children: "Entreprise" })] }), _jsx("button", { type: "submit", children: "S'inscrire" }), error && _jsx("p", { style: { color: 'red' }, children: error })] }));
}
