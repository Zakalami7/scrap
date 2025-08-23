import { Link, Outlet, useNavigate } from 'react-router-dom';
import { clearToken, getToken } from '../lib/auth';

export function RootLayout() {
  const token = getToken();
  const navigate = useNavigate();
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ marginRight: 'auto' }}>FreelanceLinkAI</h1>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link to="/">Accueil</Link>
          <Link to="/freelancers">Freelances</Link>
          <Link to="/projects">Projets</Link>
          <Link to="/recommendations">Reco</Link>
          {!token ? (
            <>
              <Link to="/login">Connexion</Link>
              <Link to="/register">Inscription</Link>
            </>
          ) : (
            <button onClick={() => { clearToken(); navigate('/'); }}>Déconnexion</button>
          )}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}