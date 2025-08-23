import { useState } from 'react';
import { apiPost } from '../lib/api';
import { setToken } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await apiPost<{ token: string }>(`/auth/login`, { email, password });
      setToken(res.token);
      navigate('/');
    } catch (e: any) {
      setError(e.message || 'Erreur');
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 320 }}>
      <h2>Connexion</h2>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Se connecter</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}