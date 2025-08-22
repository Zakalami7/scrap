import type { ProductType } from '../types/design'

const BASES: Record<ProductType, number> = {
  'cup-25': 0.6,
  'cup-50': 0.8,
  'cup-wine': 1.0,
  'cup-shot': 0.4,
  'cup-pint': 1.2,
}

const DISCOUNTS = [
  { min: 1, factor: 1.0 },
  { min: 50, factor: 0.95 },
  { min: 100, factor: 0.9 },
  { min: 250, factor: 0.85 },
  { min: 500, factor: 0.8 },
  { min: 1000, factor: 0.75 },
]

export function calculatePrice(product: ProductType, quantity: number) {
  const base = BASES[product] ?? 1
  const disc = DISCOUNTS.filter(d => quantity >= d.min).slice(-1)[0]?.factor ?? 1
  const unit = +(base * disc).toFixed(2)
  const total = +(unit * quantity).toFixed(2)
  return { unit, total }
}