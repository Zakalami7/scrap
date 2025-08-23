import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div>
      <p>Plateforme de mise en relation intelligente entre freelances et entreprises.</p>
      <ul>
        <li><Link to="/freelancers">Rechercher des freelances</Link></li>
        <li><Link to="/projects">Parcourir les projets</Link></li>
      </ul>
    </div>
  );
}