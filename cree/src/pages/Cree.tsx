import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './cree.css'
import type { DesignLayer, DesignState, ProductType, TextLayer } from '../types/design'
import { DesignStage } from '../components/DesignStage'
import { calculatePrice } from '../utils/pricing'
import { toPng } from 'html-to-image'
import type { ImageLayer } from '../types/design'
import { generateBatPdf } from '../utils/bat'
import { designToSvgString, downloadSvg } from '../utils/svg'

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
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
      locked: false,
    } as TextLayer,
  ],
  selectedLayerId: undefined,
  selectedLayerIds: [],
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
  const [past, setPast] = useState<DesignState[]>([])
  const [future, setFuture] = useState<DesignState[]>([])
  const stageWrapperRef = useRef<HTMLDivElement>(null)

  const selectedLayer = useMemo(() => state.layers.find(l => l.id === state.selectedLayerId), [state.layers, state.selectedLayerId])

  function pushHistory(snapshot?: DesignState) {
    const snap = snapshot ?? state
    setPast(p => [...p, deepClone(snap)])
    setFuture([])
  }

  function updateState(partial: Partial<DesignState>, push = true) {
    if (push) pushHistory()
    setState(prev => ({ ...prev, ...partial }))
  }

  function onSelectLayer(layerId: string, options?: { additive?: boolean }) {
    // Clear when background or empty
    if (!layerId) {
      updateState({ selectedLayerId: undefined, selectedLayerIds: [] }, false)
      return
    }
    const additive = !!options?.additive
    if (additive) {
      const exists = state.selectedLayerIds?.includes(layerId)
      const nextIds = exists
        ? (state.selectedLayerIds || []).filter(id => id !== layerId)
        : [ ...(state.selectedLayerIds || []), layerId ]
      updateState({ selectedLayerIds: nextIds, selectedLayerId: nextIds[nextIds.length - 1] }, false)
    } else {
      updateState({ selectedLayerIds: [layerId], selectedLayerId: layerId }, false)
    }
  }

  function onMoveLayer(layerId: string, x: number, y: number) {
    setState(prev => ({
      ...prev,
      layers: prev.layers.map(l => (l.id === layerId ? { ...l, x, y } : l)),
    }))
  }

  function onUpdateLayer(layerId: string, partial: Partial<DesignLayer>) {
    pushHistory()
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
    pushHistory()
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
      locked: false,
    }
    setState(prev => ({ ...prev, layers: [...prev.layers, newLayer], selectedLayerId: newLayer.id, selectedLayerIds: [newLayer.id] }))
  }

  function onToggleLock() {
    if (!selectedLayer) return
    onUpdateLayer(selectedLayer.id, { locked: !selectedLayer.locked })
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
        pushHistory()
        const newLayer: ImageLayer = {
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
          locked: false,
        }
        setState(prev => ({ ...prev, layers: [...prev.layers, newLayer], selectedLayerId: newLayer.id, selectedLayerIds: [newLayer.id] }))
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  function duplicateSelected() {
    const ids = state.selectedLayerIds && state.selectedLayerIds.length > 0
      ? state.selectedLayerIds
      : (state.selectedLayerId ? [state.selectedLayerId] : [])
    if (ids.length === 0) return
    pushHistory()
    const offset = 12
    const originals = state.layers.filter(l => ids.includes(l.id))
    const duplicates: DesignLayer[] = originals.map(l => {
      const base = { ...l, id: generateId('dup'), x: l.x + offset, y: l.y + offset }
      return base
    })
    const nextLayers = [...state.layers, ...duplicates]
    const nextIds = duplicates.map(d => d.id)
    setState(prev => ({ ...prev, layers: nextLayers, selectedLayerId: nextIds[nextIds.length - 1], selectedLayerIds: nextIds }))
  }

  function undo() {
    setPast(p => {
      if (p.length === 0) return p
      setFuture(f => [deepClone(state), ...f])
      const prevState = p[p.length - 1]
      setState(deepClone(prevState))
      return p.slice(0, -1)
    })
  }

  function redo() {
    setFuture(f => {
      if (f.length === 0) return f
      setPast(p => [...p, deepClone(state)])
      const next = f[0]
      setState(deepClone(next))
      return f.slice(1)
    })
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMod = e.ctrlKey || e.metaKey
      if (isMod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((isMod && e.key.toLowerCase() === 'y') || (isMod && e.key.toLowerCase() === 'z' && e.shiftKey)) {
        e.preventDefault()
        redo()
      } else if (isMod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        duplicateSelected()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const hasMulti = (state.selectedLayerIds?.length || 0) > 0
        if (state.selectedLayerId || hasMulti) {
          e.preventDefault()
          onDeleteSelected()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.selectedLayerId, state.selectedLayerIds, state])

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

  function onExportSVG() {
    const printArea = PRINT_ZONES[state.product]
    const svg = designToSvgString(state, { printArea })
    downloadSvg(svg)
  }

  function saveToLocal() {
    localStorage.setItem('cree-design', JSON.stringify(state))
  }

  function loadFromLocal() {
    const raw = localStorage.getItem('cree-design')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as DesignState
      pushHistory()
      setState(parsed)
    } catch {}
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cree-design.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as DesignState
        pushHistory()
        setState(parsed)
      } catch {}
    }
    reader.readAsText(file)
  }

  function onDeleteSelected() {
    const ids = state.selectedLayerIds && state.selectedLayerIds.length > 0
      ? state.selectedLayerIds
      : (state.selectedLayerId ? [state.selectedLayerId] : [])
    if (ids.length === 0) return
    pushHistory()
    setState(prev => ({
      ...prev,
      layers: prev.layers.filter(l => !ids.includes(l.id)),
      selectedLayerId: undefined,
      selectedLayerIds: [],
    }))
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
          {selectedLayer && (
            <div className="control-group">
              <button onClick={onToggleLock}>{selectedLayer.locked ? 'Déverrouiller le calque' : 'Verrouiller le calque'}</button>
            </div>
          )}
          {selectedLayer && selectedLayer.type === 'text' && (
            <div className="control-group">
              <label>Texte</label>
              <input
                type="text"
                value={selectedLayer.text}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { text: e.target.value })}
                disabled={selectedLayer.locked}
              />
              <label>Taille</label>
              <input
                type="range"
                min={10}
                max={72}
                value={selectedLayer.fontSize}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { fontSize: Number(e.target.value) })}
                disabled={selectedLayer.locked}
              />
              <label>Alignement</label>
              <select
                value={selectedLayer.textAlign}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { textAlign: e.target.value as any })}
                disabled={selectedLayer.locked}
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
                disabled={selectedLayer.locked}
              />
            </div>
          )}
          {selectedLayer && selectedLayer.type === 'image' && (
            <div className="control-group">
              <label>Largeur (px)</label>
              <input
                type="number"
                min={16}
                value={selectedLayer.width}
                onChange={(e) => {
                  const w = Math.max(16, Number(e.target.value) || 0)
                  const ratio = selectedLayer.naturalWidth && selectedLayer.naturalHeight ? selectedLayer.naturalHeight / selectedLayer.naturalWidth : selectedLayer.height / selectedLayer.width
                  onUpdateLayer(selectedLayer.id, { width: w, height: Math.round(w * ratio) })
                }}
                disabled={selectedLayer.locked}
              />
              <label>Hauteur (px)</label>
              <input
                type="number"
                min={16}
                value={selectedLayer.height}
                onChange={(e) => {
                  const h = Math.max(16, Number(e.target.value) || 0)
                  const ratio = selectedLayer.naturalWidth && selectedLayer.naturalHeight ? selectedLayer.naturalWidth / selectedLayer.naturalHeight : selectedLayer.width / selectedLayer.height
                  onUpdateLayer(selectedLayer.id, { height: h, width: Math.round(h * ratio) })
                }}
                disabled={selectedLayer.locked}
              />
            </div>
          )}
          <div className="control-group">
            <button onClick={duplicateSelected} disabled={((state.selectedLayerIds?.length || 0) === 0 && !state.selectedLayerId)}>Dupliquer (Ctrl+D)</button>
          </div>
          <div className="control-group">
            <label>Rotation</label>
            <input
              type="range"
              min={-180}
              max={180}
              value={selectedLayer?.rotationDeg ?? 0}
              onChange={(e) => selectedLayer && onUpdateLayer(selectedLayer.id!, { rotationDeg: Number(e.target.value) })}
              disabled={!selectedLayer || selectedLayer.locked}
            />
            <label>Opacité</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={selectedLayer?.opacity ?? 1}
              onChange={(e) => selectedLayer && onUpdateLayer(selectedLayer.id!, { opacity: Number(e.target.value) })}
              disabled={!selectedLayer || selectedLayer.locked}
            />
          </div>
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
            <button onClick={onExportSVG}>Exporter SVG</button>
          </div>
          <div className="control-group">
            <button onClick={undo} disabled={past.length === 0}>Annuler (Ctrl/Cmd+Z)</button>
            <button onClick={redo} disabled={future.length === 0}>Rétablir (Ctrl+Y)</button>
          </div>
          <div className="control-group">
            <button onClick={saveToLocal}>Sauvegarder (local)</button>
            <button onClick={loadFromLocal}>Charger</button>
            <button onClick={exportJSON}>Exporter JSON</button>
            <input type="file" accept="application/json" onChange={importJSON} />
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
            selectedLayerIds={state.selectedLayerIds}
            onSelectLayer={onSelectLayer}
            onMoveLayer={onMoveLayer}
            onUpdateLayer={onUpdateLayer}
            printArea={printArea}
            onDragStart={() => pushHistory()}
            snapGridPx={8}
            showGuides
          />
        </div>
      </main>
    </div>
  )
}