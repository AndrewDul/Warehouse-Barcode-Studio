import { describe, expect, it } from 'vitest'
import { isSupportedFile, parseTextLines } from '../lib/parser'
import { validateValue } from '../lib/barcode'

describe('text line parsing', () => {
  it('keeps each non-empty source line as one code value', () => {
    expect(parseTextLines('  PALLET-01\r\n\n AISLE-A-04 \n\t\nBIN-9 ')).toEqual([
      'PALLET-01',
      'AISLE-A-04',
      'BIN-9',
    ])
  })

  it('removes a UTF-8 byte order mark and non-breaking spaces', () => {
    expect(parseTextLines('\uFEFFALPHA\n\u00A0BETA\u00A0')).toEqual(['ALPHA', 'BETA'])
  })
})

describe('file and barcode validation', () => {
  it('accepts only the stated import formats', () => {
    expect(isSupportedFile('labels.XLSX')).toBe(true)
    expect(isSupportedFile('notes.docx')).toBe(true)
    expect(isSupportedFile('image.png')).toBe(false)
  })

  it('reports values Code 39 cannot encode', () => {
    expect(validateValue('ITEM-42', 'CODE39')).toBeUndefined()
    expect(validateValue('item-42', 'CODE39')).toMatch(/uppercase/)
  })

  it('allows a QR code to hold lower-case text', () => {
    expect(validateValue('zone-a/row-2', 'QR')).toBeUndefined()
  })
})
