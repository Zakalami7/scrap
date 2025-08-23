import { Link, Outlet } from 'react-router-dom';

export function RootLayout() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ marginRight: 'auto' }}>FreelanceLinkAI</h1>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link to="/">Accueil</Link>
          <Link to="/freelancers">Freelances</Link>
          <Link to="/projects">Projets</Link>
          <Link to="/recommendations">Reco</Link>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}