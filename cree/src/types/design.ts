export type ProductType = 'cup-25' | 'cup-50' | 'cup-wine' | 'cup-shot' | 'cup-pint'

export interface DesignLayerBase {
  id: string
  x: number
  y: number
  rotationDeg: number
  opacity: number
  locked?: boolean
}

export interface TextLayer extends DesignLayerBase {
  type: 'text'
  text: string
  fontFamily: string
  fontSize: number
  color: string
  textAlign: 'left' | 'center' | 'right'
}

export interface ImageLayer extends DesignLayerBase {
  type: 'image'
  src: string
  width: number
  height: number
  naturalWidth?: number
  naturalHeight?: number
}

export type DesignLayer = TextLayer | ImageLayer

export interface DesignState {
  product: ProductType
  productColorHex: string
  layers: DesignLayer[]
  selectedLayerId?: string
}