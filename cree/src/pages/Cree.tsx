import { Link } from 'react-router-dom'
import './cree.css'

export function Cree() {
  return (
    <div className="cree-layout">
      <aside className="cree-sidebar">
        <h1>crée</h1>
        <nav>
          <Link to="/">Accueil</Link>
        </nav>
        <div className="controls">
          <div className="control-group">
            <label>Produit</label>
            <select>
              <option value="cup-25">Gobelet 25cl</option>
              <option value="cup-50">Gobelet 50cl</option>
              <option value="cup-wine">Verre à vin</option>
            </select>
          </div>
          <div className="control-group">
            <label>Couleur</label>
            <input type="color" defaultValue="#ffffff" />
          </div>
        </div>
      </aside>
      <main className="cree-canvas">
        <div className="preview-stage">
          <div className="product-mock" />
          <div className="design-layer">Votre design ici</div>
        </div>
      </main>
    </div>
  )
}