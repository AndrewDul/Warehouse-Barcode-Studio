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
  printLayout?: 'single' | 'sheet'
  labelWidthMm?: number
  labelHeightMm?: number
  columns?: number
  rows?: number
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
  {
    id: 'a4-3x7',
    name: 'A4 sheet — 21 labels (3 × 7)',
    widthMm: 210,
    heightMm: 297,
    labelWidthMm: 63.5,
    labelHeightMm: 38.1,
    columns: 3,
    rows: 7,
    printLayout: 'sheet',
    printerHint: 'Standard A4 printer paper · 21 compact labels per page',
  },
  {
    id: 'a4-2x5',
    name: 'A4 sheet — 10 labels (2 × 5)',
    widthMm: 210,
    heightMm: 297,
    labelWidthMm: 96,
    labelHeightMm: 52,
    columns: 2,
    rows: 5,
    printLayout: 'sheet',
    printerHint: 'Standard A4 printer paper · 10 large labels per page',
  },
  {
    id: 'a5-2x4',
    name: 'A5 sheet — 8 labels (2 × 4)',
    widthMm: 148,
    heightMm: 210,
    labelWidthMm: 67,
    labelHeightMm: 43,
    columns: 2,
    rows: 4,
    printLayout: 'sheet',
    printerHint: 'Compact A5 printer paper · 8 labels per page',
  },
  {
    id: 'letter-3x10',
    name: 'US Letter sheet — 30 labels (3 × 10)',
    widthMm: 215.9,
    heightMm: 279.4,
    labelWidthMm: 66,
    labelHeightMm: 24,
    columns: 3,
    rows: 10,
    printLayout: 'sheet',
    printerHint: 'US Letter printer paper · 30 address-size labels per page',
  },
]
