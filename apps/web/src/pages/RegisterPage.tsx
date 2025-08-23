import { useState } from 'react';
import { apiPost } from '../lib/api';
import { setToken } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'FREELANCER' | 'COMPANY'>('FREELANCER');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await apiPost<{ token: string }>(`/auth/register`, { email, password, name: name || undefined, role });
      setToken(res.token);
      navigate('/');
    } catch (e: any) {
      setError(e.message || 'Erreur');
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 360 }}>
      <h2>Créer un compte</h2>
      <input placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <select value={role} onChange={(e) => setRole(e.target.value as any)}>
        <option value="FREELANCER">Freelance</option>
        <option value="COMPANY">Entreprise</option>
      </select>
      <button type="submit">S'inscrire</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}