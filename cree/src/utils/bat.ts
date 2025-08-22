import { jsPDF } from 'jspdf'

export interface BatOptions {
  previewDataUrl: string
  productLabel: string
  quantity: number
}

export async function generateBatPdf(opts: BatOptions) {
  const { previewDataUrl, productLabel, quantity } = opts
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(16)
  pdf.text('BAT - Bon à tirer', 15, 20)

  pdf.setFontSize(11)
  const dateStr = new Date().toLocaleDateString()
  pdf.text(`Produit: ${productLabel}`, 15, 30)
  pdf.text(`Quantité: ${quantity}`, 15, 36)
  pdf.text(`Date: ${dateStr}`, 15, 42)

  // Place preview image (approx 120mm wide, keep ratio)
  const imgWidth = 120
  const imgHeight = 120
  pdf.addImage(previewDataUrl, 'PNG', 15, 55, imgWidth, imgHeight)

  pdf.setFontSize(10)
  pdf.text('Validation client:', 15, 190)
  pdf.line(15, 195, 120, 195)

  return pdf
}