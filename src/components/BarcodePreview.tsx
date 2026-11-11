import { useEffect, useState } from 'react'
import { makeBarcodeSvg } from '../lib/barcode'
import type { BarcodeLabel } from '../lib/types'

interface BarcodePreviewProps {
  label: BarcodeLabel
  compact?: boolean
}

export function BarcodePreview({ label, compact = false }: BarcodePreviewProps) {
  const [svg, setSvg] = useState('')

  useEffect(() => {
    let mounted = true
    makeBarcodeSvg(label.value, label.format)
      .then((markup) => {
        if (mounted) setSvg(markup)
      })
      .catch(() => {
        if (mounted) setSvg('')
      })
    return () => { mounted = false }
  }, [label.format, label.value])

  if (!label.valid) {
    return <div className="barcode-error"><span>!</span>{label.error}</div>
  }

  return (
    <div
      className={`barcode-art ${compact ? 'barcode-art--compact' : ''}`}
      aria-label={`${label.format} label preview for ${label.value}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
