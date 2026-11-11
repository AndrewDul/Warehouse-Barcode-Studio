export const barcodeFormats = ['CODE128', 'CODE39', 'CODE93', 'QR'] as const

export type BarcodeFormat = (typeof barcodeFormats)[number]

export interface BarcodeLabel {
  id: string
  value: string
  format: BarcodeFormat
  valid: boolean
  error?: string
}

export interface LabelProfile {
  id: string
  name: string
  widthMm: number
  heightMm: number
  printerHint: string
}

export const labelProfiles: LabelProfile[] = [
  {
    id: 'zebra-4x6',
    name: 'Zebra ZD220 — shipping 4 × 6 in',
    widthMm: 101.6,
    heightMm: 152.4,
    printerHint: '4 × 6 in / 102 × 152 mm',
  },
  {
    id: 'warehouse-100x50',
    name: 'Warehouse label — 100 × 50 mm',
    widthMm: 100,
    heightMm: 50,
    printerHint: 'Wide product or location label',
  },
  {
    id: 'shelf-70x32',
    name: 'Shelf edge — 70 × 32 mm',
    widthMm: 70,
    heightMm: 32,
    printerHint: 'Compact shelf label',
  },
  {
    id: 'small-50x25',
    name: 'Small item — 50 × 25 mm',
    widthMm: 50,
    heightMm: 25,
    printerHint: 'Small product label',
  },
]
