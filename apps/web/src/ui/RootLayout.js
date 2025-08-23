import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { clearToken, getToken } from '../lib/auth';
export function RootLayout() {
    const token = getToken();
    const navigate = useNavigate();
    return (_jsxs("div", { style: { maxWidth: 960, margin: '0 auto', padding: 24 }, children: [_jsxs("header", { style: { display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }, children: [_jsx("h1", { style: { marginRight: 'auto' }, children: "FreelanceLinkAI" }), _jsxs("nav", { style: { display: 'flex', gap: 12 }, children: [_jsx(Link, { to: "/", children: "Accueil" }), _jsx(Link, { to: "/freelancers", children: "Freelances" }), _jsx(Link, { to: "/projects", children: "Projets" }), _jsx(Link, { to: "/recommendations", children: "Reco" }), !token ? (_jsxs(_Fragment, { children: [_jsx(Link, { to: "/login", children: "Connexion" }), _jsx(Link, { to: "/register", children: "Inscription" })] })) : (_jsx("button", { onClick: () => { clearToken(); navigate('/'); }, children: "D\u00E9connexion" }))] })] }), _jsx(Outlet, {})] }));
}
