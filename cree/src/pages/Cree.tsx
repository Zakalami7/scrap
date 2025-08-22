import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './cree.css'
import type { DesignLayer, DesignState, ProductType, TextLayer } from '../types/design'
import { DesignStage } from '../components/DesignStage'
import { calculatePrice } from '../utils/pricing'
import { toPng } from 'html-to-image'
import type { ImageLayer } from '../types/design'
import { generateBatPdf } from '../utils/bat'

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

const PRINT_ZONES: Record<ProductType, { x: number; y: number; width: number; height: number }> = {
  'cup-25': { x: 120, y: 120, width: 220, height: 220 },
  'cup-50': { x: 110, y: 110, width: 240, height: 240 },
  'cup-wine': { x: 130, y: 110, width: 200, height: 220 },
  'cup-shot': { x: 160, y: 160, width: 160, height: 160 },
  'cup-pint': { x: 110, y: 100, width: 260, height: 260 },
}

export function Cree() {
  const [state, setState] = useState<DesignState>(INITIAL_STATE)
  const [quantity, setQuantity] = useState<number>(100)
  const stageWrapperRef = useRef<HTMLDivElement>(null)

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
      layers: prev.layers.map(l => {
        if (l.id !== layerId) return l
        if (l.type === 'text') {
          return { ...l, ...(partial as Partial<TextLayer>) } as TextLayer
        }
        return { ...l, ...(partial as Partial<ImageLayer>) } as ImageLayer
      }),
    }))
  }

  function onAddText() {
    const zone = PRINT_ZONES[state.product]
    const newLayer: TextLayer = {
      id: generateId('text'),
      type: 'text',
      text: 'Nouveau texte',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 18,
      color: '#111827',
      textAlign: 'left',
      x: zone.x + 12,
      y: zone.y + 12,
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

  function onImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result)
      const img = new Image()
      img.onload = () => {
        const zone = PRINT_ZONES[state.product]
        const newLayer: DesignLayer = {
          id: generateId('img'),
          type: 'image',
          src,
          width: Math.min(200, img.width),
          height: Math.min(200, img.height),
          naturalWidth: img.width,
          naturalHeight: img.height,
          x: zone.x + 20,
          y: zone.y + 20,
          rotationDeg: 0,
          opacity: 1,
        } as DesignLayer
        setState(prev => ({ ...prev, layers: [...prev.layers, newLayer], selectedLayerId: newLayer.id }))
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  async function onExportPNG() {
    if (!stageWrapperRef.current) return
    const dataUrl = await toPng(stageWrapperRef.current)
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'cree-apercu.png'
    a.click()
  }

  async function onExportBAT() {
    if (!stageWrapperRef.current) return
    const dataUrl = await toPng(stageWrapperRef.current)
    const productLabel =
      state.product === 'cup-25' ? 'Gobelet 25cl' : state.product === 'cup-50' ? 'Gobelet 50cl' : state.product === 'cup-wine' ? 'Verre à vin' : state.product === 'cup-shot' ? 'Shooter' : 'Pinte'
    const pdf = await generateBatPdf({ previewDataUrl: dataUrl, productLabel, quantity })
    pdf.save('cree-bat.pdf')
  }

  const mockStyle: React.CSSProperties = {
    background: `linear-gradient(180deg, ${state.productColorHex}, #e5e5e5)`,
  }

  const price = calculatePrice(state.product, quantity)
  const printArea = PRINT_ZONES[state.product]

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
              <option value="cup-shot">Shooter</option>
              <option value="cup-pint">Pinte</option>
            </select>
          </div>
          <div className="control-group">
            <label>Couleur</label>
            <input type="color" value={state.productColorHex} onChange={onChangeColor} />
          </div>
          <div className="control-group">
            <button onClick={onAddText}>Ajouter un texte</button>
            <input type="file" accept="image/*" onChange={onImageUpload} />
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
                max={72}
                value={selectedLayer.fontSize}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { fontSize: Number(e.target.value) })}
              />
              <label>Alignement</label>
              <select
                value={selectedLayer.textAlign}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { textAlign: e.target.value as any })}
              >
                <option value="left">Gauche</option>
                <option value="center">Centre</option>
                <option value="right">Droite</option>
              </select>
              <label>Couleur du texte</label>
              <input
                type="color"
                value={selectedLayer.color}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { color: e.target.value })}
              />
            </div>
          )}
          {selectedLayer && (
            <div className="control-group">
              <label>Rotation</label>
              <input
                type="range"
                min={-180}
                max={180}
                value={selectedLayer.rotationDeg}
                onChange={(e) => onUpdateLayer(selectedLayer.id!, { rotationDeg: Number(e.target.value) })}
              />
              <label>Opacité</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={selectedLayer.opacity}
                onChange={(e) => onUpdateLayer(selectedLayer.id!, { opacity: Number(e.target.value) })}
              />
            </div>
          )}
          <div className="control-group">
            <label>Quantité</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            />
            <div>
              <strong>{price.unit.toFixed(2)}€</strong> / unité — Total: <strong>{price.total.toFixed(2)}€</strong>
            </div>
          </div>
          <div className="control-group">
            <button onClick={onExportPNG}>Exporter PNG</button>
            <button onClick={onExportBAT}>Exporter BAT (PDF)</button>
          </div>
        </div>
      </aside>
      <main className="cree-canvas">
        <div className="preview-stage" ref={stageWrapperRef}>
          <div className="product-mock" style={mockStyle} />
          <div className="print-area" style={{ left: printArea.x, top: printArea.y, width: printArea.width, height: printArea.height }} />
          <DesignStage
            layers={state.layers}
            selectedLayerId={state.selectedLayerId}
            onSelectLayer={onSelectLayer}
            onMoveLayer={onMoveLayer}
            onUpdateLayer={onUpdateLayer}
            printArea={printArea}
          />
        </div>
      </main>
    </div>
  )
}