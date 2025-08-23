import { useEffect, useRef, useState } from 'react'
import type { DesignLayer } from '../types/design'

export interface DesignStageProps {
  layers: DesignLayer[]
  selectedLayerId?: string
  onSelectLayer: (layerId: string) => void
  onMoveLayer: (layerId: string, x: number, y: number) => void
  onUpdateLayer: (layerId: string, partial: Partial<DesignLayer>) => void
  stageRef?: React.RefObject<HTMLDivElement>
  printArea?: { x: number; y: number; width: number; height: number }
  onDragStart?: () => void
  onDragEnd?: () => void
  snapGridPx?: number
  showGuides?: boolean
}

interface DragState {
  layerId: string
  startMouseX: number
  startMouseY: number
  startX: number
  startY: number
}

export function DesignStage(props: DesignStageProps) {
  const { layers, selectedLayerId, onSelectLayer, onMoveLayer, stageRef, printArea, onDragStart, onDragEnd, snapGridPx = 8, showGuides = true } = props
  const internalStageRef = useRef<HTMLDivElement>(null)
  const containerRef = stageRef ?? internalStageRef
  const [drag, setDrag] = useState<DragState | undefined>(undefined)
  const [showVGuide, setShowVGuide] = useState(false)
  const [showHGuide, setShowHGuide] = useState(false)

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!drag) return
      const dx = e.clientX - drag.startMouseX
      const dy = e.clientY - drag.startMouseY
      let nextX = Math.round(drag.startX + dx)
      let nextY = Math.round(drag.startY + dy)

      // Grid snapping
      if (snapGridPx > 0) {
        nextX = Math.round(nextX / snapGridPx) * snapGridPx
        nextY = Math.round(nextY / snapGridPx) * snapGridPx
      }

      // Clamp to print area
      let vGuide = false
      let hGuide = false
      if (printArea) {
        const layer = layers.find(l => l.id === drag.layerId)
        const minPad = 16
        const layerWidth = layer && layer.type === 'image' ? layer.width : minPad
        const layerHeight = layer && layer.type === 'image' ? layer.height : minPad
        const maxX = printArea.x + Math.max(0, printArea.width - layerWidth)
        const maxY = printArea.y + Math.max(0, printArea.height - layerHeight)
        nextX = Math.min(Math.max(nextX, printArea.x), maxX)
        nextY = Math.min(Math.max(nextY, printArea.y), maxY)

        // Center guide snapping (images preferred)
        if (showGuides && layer) {
          const centerThreshold = 6
          const paCenterX = printArea.x + printArea.width / 2
          const paCenterY = printArea.y + printArea.height / 2
          const lCenterX = nextX + (layer.type === 'image' ? layer.width / 2 : minPad / 2)
          const lCenterY = nextY + (layer.type === 'image' ? layer.height / 2 : minPad / 2)
          if (Math.abs(lCenterX - paCenterX) <= centerThreshold) {
            // snap X so layer is horizontally centered
            nextX = Math.round(paCenterX - (layer.type === 'image' ? layer.width / 2 : minPad / 2))
            vGuide = true
          }
          if (Math.abs(lCenterY - paCenterY) <= centerThreshold) {
            nextY = Math.round(paCenterY - (layer.type === 'image' ? layer.height / 2 : minPad / 2))
            hGuide = true
          }
        }
      }

      setShowVGuide(vGuide)
      setShowHGuide(hGuide)
      onMoveLayer(drag.layerId, nextX, nextY)
    }
    function handleMouseUp() {
      if (drag) {
        onDragEnd && onDragEnd()
      }
      setDrag(undefined)
      setShowVGuide(false)
      setShowHGuide(false)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [drag, onMoveLayer, layers, printArea, onDragEnd, snapGridPx, showGuides])

  function onLayerMouseDown(e: React.MouseEvent, layer: DesignLayer) {
    e.stopPropagation()
    onSelectLayer(layer.id)
    if (layer.locked) return
    onDragStart && onDragStart()
    setDrag({
      layerId: layer.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: layer.x,
      startY: layer.y,
    })
  }

  function onBackgroundMouseDown() {
    onSelectLayer('')
  }

  return (
    <div
      ref={containerRef}
      className="design-stage"
      onMouseDown={onBackgroundMouseDown}
    >
      {printArea && showGuides && (
        <>
          {showVGuide && (
            <div className="guide-line guide-vertical" style={{ left: printArea.x + printArea.width / 2 }} />
          )}
          {showHGuide && (
            <div className="guide-line guide-horizontal" style={{ top: printArea.y + printArea.height / 2 }} />
          )}
        </>
      )}
      {layers.map((layer) => {
        const isSelected = layer.id === selectedLayerId
        const baseStyle: React.CSSProperties = {
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(${layer.x}px, ${layer.y}px) rotate(${layer.rotationDeg}deg)`,
          transformOrigin: 'top left',
          opacity: layer.opacity,
          cursor: layer.locked ? 'not-allowed' : 'move',
          outline: isSelected ? '2px solid #2563eb' : 'none',
          boxShadow: isSelected ? '0 0 0 4px rgba(37,99,235,0.15)' : undefined,
          pointerEvents: 'auto',
        }
        if (layer.type === 'text') {
          return (
            <div
              key={layer.id}
              className="layer-text"
              onMouseDown={(e) => onLayerMouseDown(e, layer)}
              style={{
                ...baseStyle,
                color: layer.color,
                fontFamily: layer.fontFamily,
                fontSize: layer.fontSize,
                whiteSpace: 'pre-wrap',
                textAlign: layer.textAlign,
                padding: 4,
                background: 'transparent',
                userSelect: 'none',
                opacity: layer.locked ? Math.min(layer.opacity, 0.85) : layer.opacity,
              }}
            >
              {layer.text}
            </div>
          )
        }
        if (layer.type === 'image') {
          return (
            <img
              key={layer.id}
              className="layer-image"
              src={layer.src}
              alt=""
              draggable={false}
              onMouseDown={(e) => onLayerMouseDown(e, layer)}
              style={{
                ...baseStyle,
                width: layer.width,
                height: layer.height,
                userSelect: 'none',
                opacity: layer.locked ? Math.min(layer.opacity, 0.85) : layer.opacity,
              }}
            />
          )
        }
        return null
      })}
    </div>
  )
}