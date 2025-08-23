import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
export function HomePage() {
    return (_jsxs("div", { children: [_jsx("p", { children: "Plateforme de mise en relation intelligente entre freelances et entreprises." }), _jsxs("ul", { children: [_jsx("li", { children: _jsx(Link, { to: "/freelancers", children: "Rechercher des freelances" }) }), _jsx("li", { children: _jsx(Link, { to: "/projects", children: "Parcourir les projets" }) })] })] }));
}
