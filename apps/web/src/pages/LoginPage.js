import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { apiPost } from '../lib/api';
import { setToken } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        try {
            const res = await apiPost(`/auth/login`, { email, password });
            setToken(res.token);
            navigate('/');
        }
        catch (e) {
            setError(e.message || 'Erreur');
        }
    }
    return (_jsxs("form", { onSubmit: onSubmit, style: { maxWidth: 320 }, children: [_jsx("h2", { children: "Connexion" }), _jsx("input", { placeholder: "Email", value: email, onChange: (e) => setEmail(e.target.value) }), _jsx("input", { placeholder: "Mot de passe", type: "password", value: password, onChange: (e) => setPassword(e.target.value) }), _jsx("button", { type: "submit", children: "Se connecter" }), error && _jsx("p", { style: { color: 'red' }, children: error })] }));
}
