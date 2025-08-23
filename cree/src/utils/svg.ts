import type { DesignState } from '../types/design'

export interface SvgExportOptions {
  printArea: { x: number; y: number; width: number; height: number }
  filename?: string
}

export function designToSvgString(state: DesignState, opts: SvgExportOptions): string {
  const { printArea } = opts
  const { width, height, x: offsetX, y: offsetY } = printArea

  const svgParts: string[] = []
  svgParts.push(`<?xml version="1.0" encoding="UTF-8"?>`)
  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
  )

  // Background white
  svgParts.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />`)

  for (const layer of state.layers) {
    const lx = layer.x - offsetX
    const ly = layer.y - offsetY
    const rotate = layer.rotationDeg || 0
    const opacity = layer.opacity ?? 1

    if (layer.type === 'image') {
      // Embed image as href (assumed data URL)
      svgParts.push(
        `<image x="${lx}" y="${ly}" width="${layer.width}" height="${layer.height}" opacity="${opacity}" transform="rotate(${rotate}, ${lx}, ${ly})" href="${layer.src}" />`
      )
    } else if (layer.type === 'text') {
      const fill = layer.color || '#111827'
      const fontSize = layer.fontSize || 16
      const fontFamily = layer.fontFamily || 'Inter, system-ui, sans-serif'
      let anchor = 'start'
      if (layer.textAlign === 'center') anchor = 'middle'
      if (layer.textAlign === 'right') anchor = 'end'
      // Use dominant-baseline for vertical alignment approximation
      const cx = lx
      const cy = ly
      const tx = anchor === 'middle' ? cx : anchor === 'end' ? cx : cx
      const transform = rotate !== 0 ? ` transform="rotate(${rotate}, ${tx}, ${cy})"` : ''
      svgParts.push(
        `<text x="${tx}" y="${cy}" fill="${fill}" opacity="${opacity}" font-size="${fontSize}" font-family="${escapeXml(fontFamily)}" text-anchor="${anchor}" dominant-baseline="hanging"${transform}>${escapeXml(layer.text)}</text>`
      )
    }
  }

  svgParts.push(`</svg>`)
  return svgParts.join('')
}

export function downloadSvg(svgString: string, filename = 'cree-design.svg') {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function escapeXml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}