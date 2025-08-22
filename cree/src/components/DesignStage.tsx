import { useEffect, useMemo, useRef, useState } from 'react'
import type { DesignLayer } from '../types/design'

export interface DesignStageProps {
  layers: DesignLayer[]
  selectedLayerId?: string
  onSelectLayer: (layerId: string) => void
  onMoveLayer: (layerId: string, x: number, y: number) => void
  onUpdateLayer: (layerId: string, partial: Partial<DesignLayer>) => void
  backgroundStyle?: React.CSSProperties
  stageRef?: React.RefObject<HTMLDivElement>
}

interface DragState {
  layerId: string
  startMouseX: number
  startMouseY: number
  startX: number
  startY: number
}

export function DesignStage(props: DesignStageProps) {
  const { layers, selectedLayerId, onSelectLayer, onMoveLayer, backgroundStyle, stageRef } = props
  const internalStageRef = useRef<HTMLDivElement>(null)
  const containerRef = stageRef ?? internalStageRef
  const [drag, setDrag] = useState<DragState | undefined>(undefined)

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!drag) return
      const dx = e.clientX - drag.startMouseX
      const dy = e.clientY - drag.startMouseY
      onMoveLayer(drag.layerId, Math.round(drag.startX + dx), Math.round(drag.startY + dy))
    }
    function handleMouseUp() {
      setDrag(undefined)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [drag, onMoveLayer])

  function onLayerMouseDown(e: React.MouseEvent, layer: DesignLayer) {
    e.stopPropagation()
    onSelectLayer(layer.id)
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
      className="preview-stage"
      style={backgroundStyle}
      onMouseDown={onBackgroundMouseDown}
    >
      {layers.map((layer) => {
        const isSelected = layer.id === selectedLayerId
        const baseStyle: React.CSSProperties = {
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(${layer.x}px, ${layer.y}px) rotate(${layer.rotationDeg}deg)`,
          transformOrigin: 'top left',
          opacity: layer.opacity,
          cursor: 'move',
          outline: isSelected ? '2px solid #2563eb' : 'none',
          boxShadow: isSelected ? '0 0 0 4px rgba(37,99,235,0.15)' : undefined,
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
              }}
            />
          )
        }
        return null
      })}
    </div>
  )
}