import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import type { BarcodeFormat, BarcodeLabel, LabelProfile } from './types'

export function validateValue(value: string, format: BarcodeFormat): string | undefined {
  if (!value.trim()) return 'A label value is required.'
  if (value.length > 180) return 'Maximum value length is 180 characters.'
  if (format === 'CODE39' && !/^[0-9A-Z\-\. \$\/+%]+$/.test(value)) {
    return 'Code 39 accepts uppercase A–Z, 0–9, space and - . $ / + %.'
  }
  if (format === 'CODE93' && /[\x00-\x1F\x7F-\xFF]/.test(value)) {
    return 'Code 93 accepts printable ASCII characters only.'
  }
  return undefined
}

export async function makeBarcodeSvg(value: string, format: BarcodeFormat): Promise<string> {
  if (format === 'QR') {
    return QRCode.toString(value, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#111018', light: '#ffffff' },
      width: 320,
    })
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  JsBarcode(svg, value, {
    format,
    lineColor: '#111018',
    background: '#ffffff',
    displayValue: true,
    font: 'monospace',
    fontSize: 15,
    height: 84,
    margin: 12,
    width: 2,
  })
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  return new XMLSerializer().serializeToString(svg)
}

export async function svgToPngBlob(svg: string, multiplier = 3): Promise<Blob> {
  const image = new Image()
  const encoded = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('The barcode image could not be rendered.'))
    image.src = encoded
  })
  const width = Math.max(320, image.naturalWidth || image.width)
  const height = Math.max(180, image.naturalHeight || image.height)
  const canvas = document.createElement('canvas')
  canvas.width = width * multiplier
  canvas.height = height * multiplier
  const context = canvas.getContext('2d')
  if (!context) throw new Error('The browser did not provide a canvas context.')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG export failed.')), 'image/png'))
}

export function downloadBlob(blob: Blob, name: string): void {
  const anchor = document.createElement('a')
  const url = URL.createObjectURL(blob)
  anchor.href = url
  anchor.download = name
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function safeName(value: string, fallback: string): string {
  return value
    .trim()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .toLowerCase() || fallback
}

export async function exportOne(label: BarcodeLabel, kind: 'png' | 'svg'): Promise<void> {
  const svg = await makeBarcodeSvg(label.value, label.format)
  const base = `label-${safeName(label.value, label.id)}`
  if (kind === 'svg') {
    downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${base}.svg`)
    return
  }
  downloadBlob(await svgToPngBlob(svg), `${base}.png`)
}

export async function exportZip(labels: BarcodeLabel[]): Promise<void> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  for (const [index, label] of labels.entries()) {
    const name = `${String(index + 1).padStart(3, '0')}-${safeName(label.value, label.id)}`
    const svg = await makeBarcodeSvg(label.value, label.format)
    zip.file(`${name}.svg`, svg)
    zip.file(`${name}.png`, await svgToPngBlob(svg))
  }
  downloadBlob(await zip.generateAsync({ type: 'blob' }), 'warehouse-barcode-labels.zip')
}

export async function exportPdf(labels: BarcodeLabel[], profile: LabelProfile): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({
    orientation: profile.widthMm > profile.heightMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [profile.widthMm, profile.heightMm],
  })

  for (const [index, label] of labels.entries()) {
    if (index > 0) pdf.addPage([profile.widthMm, profile.heightMm])
    const svg = await makeBarcodeSvg(label.value, label.format)
    const png = await svgToPngBlob(svg)
    const url = URL.createObjectURL(png)
    try {
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, 0, profile.widthMm, profile.heightMm, 'F')
      pdf.addImage(url, 'PNG', 3, 3, profile.widthMm - 6, profile.heightMm - 6, undefined, 'FAST')
    } finally {
      URL.revokeObjectURL(url)
    }
  }
  pdf.save('warehouse-barcode-labels.pdf')
}
