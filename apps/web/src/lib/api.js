const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok)
        throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
}
export async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok)
        throw new Error(`POST ${path} failed: ${res.status}`);
    return res.json();
}
export async function apiPatch(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok)
        throw new Error(`PATCH ${path} failed: ${res.status}`);
    return res.json();
}
