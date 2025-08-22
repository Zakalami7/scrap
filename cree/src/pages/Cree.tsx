import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './cree.css'
import type { DesignLayer, DesignState, ProductType, TextLayer } from '../types/design'
import { DesignStage } from '../components/DesignStage'

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`
}

const INITIAL_STATE: DesignState = {
  product: 'cup-25',
  productColorHex: '#f5f5f5',
  layers: [
    {
      id: generateId('text'),
      type: 'text',
      text: 'Votre design ici',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 20,
      color: '#111827',
      textAlign: 'center',
      x: 160,
      y: 160,
      rotationDeg: 0,
      opacity: 1,
    } as TextLayer,
  ],
  selectedLayerId: undefined,
}

export function Cree() {
  const [state, setState] = useState<DesignState>(INITIAL_STATE)

  const selectedLayer = useMemo(() => state.layers.find(l => l.id === state.selectedLayerId), [state.layers, state.selectedLayerId])

  function updateState(partial: Partial<DesignState>) {
    setState(prev => ({ ...prev, ...partial }))
  }

  function onSelectLayer(layerId: string) {
    updateState({ selectedLayerId: layerId || undefined })
  }

  function onMoveLayer(layerId: string, x: number, y: number) {
    setState(prev => ({
      ...prev,
      layers: prev.layers.map(l => (l.id === layerId ? { ...l, x, y } : l)),
    }))
  }

  function onUpdateLayer(layerId: string, partial: Partial<DesignLayer>) {
    setState(prev => ({
      ...prev,
      layers: prev.layers.map(l => (l.id === layerId ? { ...l, ...partial } : l)),
    }))
  }

  function onAddText() {
    const newLayer: TextLayer = {
      id: generateId('text'),
      type: 'text',
      text: 'Nouveau texte',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 18,
      color: '#111827',
      textAlign: 'left',
      x: 40,
      y: 40,
      rotationDeg: 0,
      opacity: 1,
    }
    setState(prev => ({ ...prev, layers: [...prev.layers, newLayer], selectedLayerId: newLayer.id }))
  }

  function onChangeProduct(e: React.ChangeEvent<HTMLSelectElement>) {
    updateState({ product: e.target.value as ProductType })
  }

  function onChangeColor(e: React.ChangeEvent<HTMLInputElement>) {
    updateState({ productColorHex: e.target.value })
  }

  const mockStyle: React.CSSProperties = {
    background: `linear-gradient(180deg, ${state.productColorHex}, #e5e5e5)`,
  }

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
            <select value={state.product} onChange={onChangeProduct}>
              <option value="cup-25">Gobelet 25cl</option>
              <option value="cup-50">Gobelet 50cl</option>
              <option value="cup-wine">Verre à vin</option>
            </select>
          </div>
          <div className="control-group">
            <label>Couleur</label>
            <input type="color" value={state.productColorHex} onChange={onChangeColor} />
          </div>
          <div className="control-group">
            <button onClick={onAddText}>Ajouter un texte</button>
          </div>
          {selectedLayer && selectedLayer.type === 'text' && (
            <div className="control-group">
              <label>Texte</label>
              <input
                type="text"
                value={selectedLayer.text}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { text: e.target.value })}
              />
              <label>Taille</label>
              <input
                type="range"
                min={10}
                max={48}
                value={selectedLayer.fontSize}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { fontSize: Number(e.target.value) })}
              />
              <label>Couleur du texte</label>
              <input
                type="color"
                value={selectedLayer.color}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { color: e.target.value })}
              />
            </div>
          )}
        </div>
      </aside>
      <main className="cree-canvas">
        <div className="preview-stage">
          <div className="product-mock" style={mockStyle} />
          <DesignStage
            layers={state.layers}
            selectedLayerId={state.selectedLayerId}
            onSelectLayer={onSelectLayer}
            onMoveLayer={onMoveLayer}
            onUpdateLayer={onUpdateLayer}
          />
        </div>
      </main>
    </div>
  )
}