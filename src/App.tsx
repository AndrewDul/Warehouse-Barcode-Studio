import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { BarcodePreview } from './components/BarcodePreview'
import { exportOne, exportPdf, exportZip, validateValue } from './lib/barcode'
import { isSupportedFile, parseImportedFile, parseTextLines } from './lib/parser'
import { barcodeFormats, labelProfiles, type BarcodeFormat, type BarcodeLabel, type LabelProfile } from './lib/types'

type Theme = 'dark' | 'light'

const formatNames: Record<BarcodeFormat, string> = {
  CODE128: 'Code 128',
  CODE39: 'Code 39',
  CODE93: 'Code 93',
  QR: 'QR code',
}

function createLabels(lines: string[], format: BarcodeFormat): BarcodeLabel[] {
  return lines.map((value, index) => {
    const error = validateValue(value, format)
    return {
      id: `${Date.now()}-${index}-${value.slice(0, 10)}`,
      value,
      format,
      valid: !error,
      error,
    }
  })
}

export default function App() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [format, setFormat] = useState<BarcodeFormat>('CODE128')
  const [sourceText, setSourceText] = useState('')
  const [labels, setLabels] = useState<BarcodeLabel[]>([])
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [scanQuery, setScanQuery] = useState('')
  const [profile, setProfile] = useState<LabelProfile>(labelProfiles[0])
  const [customSize, setCustomSize] = useState({ width: '100', height: '50' })
  const [notice, setNotice] = useState('Ready for local-only label creation.')
  const [busy, setBusy] = useState(false)
  const uploadRef = useRef<HTMLInputElement>(null)

  const validLabels = useMemo(() => labels.filter((label) => label.valid), [labels])
  const invalidLabels = labels.length - validLabels.length
  const filteredLabels = useMemo(() => {
    const query = scanQuery.trim().toLocaleLowerCase()
    return query ? labels.filter((label) => label.value.toLocaleLowerCase().includes(query)) : labels
  }, [labels, scanQuery])
  const selectedLabel = labels.find((label) => label.id === selectedId) ?? labels[0]
  const scanLabel = filteredLabels.find((label) => label.id === selectedId) ?? filteredLabels[0]
  const scanIndex = scanLabel ? filteredLabels.findIndex((label) => label.id === scanLabel.id) : -1
  const activeProfile = profile.id === 'custom'
    ? { ...profile, widthMm: Number(customSize.width) || 100, heightMm: Number(customSize.height) || 50 }
    : profile

  function generateFromText(): void {
    const lines = parseTextLines(sourceText)
    if (!lines.length) {
      setLabels([])
      setSelectedId(undefined)
      setNotice('Add one value per line or import a supported file first.')
      return
    }
    const nextLabels = createLabels(lines, format)
    setLabels(nextLabels)
    setSelectedId(nextLabels[0]?.id)
    setScanQuery('')
    const errors = nextLabels.filter((label) => !label.valid).length
    setNotice(errors ? `${nextLabels.length} labels created; ${errors} need attention before export.` : `${nextLabels.length} labels created and ready to export.`)
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!isSupportedFile(file.name)) {
      setNotice('Unsupported file. Choose Excel (.xlsx/.xls), Word (.docx), Markdown (.md) or text (.txt).')
      return
    }
    try {
      setBusy(true)
      const result = await parseImportedFile(file)
      setSourceText(result.lines.join('\n'))
      const nextLabels = createLabels(result.lines, format)
      setLabels(nextLabels)
      setSelectedId(nextLabels[0]?.id)
      setScanQuery('')
      const warning = result.warnings.length ? ` ${result.warnings[0]}` : ''
      setNotice(`${nextLabels.length} non-empty values imported from ${file.name}.${warning}`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The file could not be read.')
    } finally {
      setBusy(false)
    }
  }

  async function runExport(action: () => Promise<void>, success: string): Promise<void> {
    if (!validLabels.length) {
      setNotice('There are no valid labels to export.')
      return
    }
    try {
      setBusy(true)
      await action()
      setNotice(success)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Export could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  function chooseProfile(value: string): void {
    if (value === 'custom') {
      setProfile({ id: 'custom', name: 'Custom size', widthMm: 100, heightMm: 50, printerHint: 'Set exact dimensions below' })
      return
    }
    const next = labelProfiles.find((item) => item.id === value)
    if (next) setProfile(next)
  }

  function printLabels(): void {
    if (!validLabels.length) {
      setNotice('Create at least one valid label before printing.')
      return
    }
    const columns = activeProfile.columns ?? 1
    const rows = activeProfile.rows ?? 1
    const labelWidth = activeProfile.labelWidthMm ?? activeProfile.widthMm
    const labelHeight = activeProfile.labelHeightMm ?? activeProfile.heightMm
    const horizontalGap = Math.max(0, (activeProfile.widthMm - columns * labelWidth) / (columns + 1))
    const verticalGap = Math.max(0, (activeProfile.heightMm - rows * labelHeight) / (rows + 1))
    document.documentElement.style.setProperty('--print-page-width', `${activeProfile.widthMm}mm`)
    document.documentElement.style.setProperty('--print-page-height', `${activeProfile.heightMm}mm`)
    document.documentElement.style.setProperty('--print-label-width', `${labelWidth}mm`)
    document.documentElement.style.setProperty('--print-label-height', `${labelHeight}mm`)
    document.documentElement.style.setProperty('--print-columns', String(columns))
    document.documentElement.style.setProperty('--print-column-gap', `${horizontalGap}mm`)
    document.documentElement.style.setProperty('--print-row-gap', `${verticalGap}mm`)
    const sheetNote = activeProfile.printLayout === 'sheet' ? ` (${columns * rows} labels per page)` : ''
    setNotice(`Opening the browser print dialog for ${activeProfile.name}${sheetNote}. Choose the matching paper size and an installed printer.`)
    const openPrintDialog = () => window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.print()))
    if (scanQuery) {
      setScanQuery('')
      openPrintDialog()
      return
    }
    openPrintDialog()
  }

  function updateScanQuery(query: string): void {
    setScanQuery(query)
    const normalized = query.trim().toLocaleLowerCase()
    if (!normalized) return
    const firstMatch = labels.find((label) => label.value.toLocaleLowerCase().includes(normalized))
    if (firstMatch) setSelectedId(firstMatch.id)
  }

  function moveScan(step: number): void {
    if (!scanLabel) return
    const next = filteredLabels[scanIndex + step]
    if (next) setSelectedId(next.id)
  }

  return (
    <div className={`app-shell theme-${theme}`}>
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <header className="topbar">
        <a className="brand" href="#studio" aria-label="Warehouse Barcode Studio home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>Warehouse <b>Barcode Studio</b></span>
        </a>
        <div className="topbar-actions">
          <span className="privacy-badge"><span className="privacy-dot" />Local-only processing</span>
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Switch colour theme">
            <span aria-hidden="true">{theme === 'dark' ? '☼' : '☾'}</span> {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      <main id="studio" className="studio-layout">
        <section className="hero panel">
          <div>
            <p className="eyebrow">LABEL WORKBENCH <span>●</span> BROWSER-LOCAL</p>
            <h1>Make every scan<br /><em>feel precise.</em></h1>
            <p className="hero-copy">Turn lines of text into reliable labels. Validate them, preview the result, export a production-ready pack or print directly to your label printer.</p>
          </div>
          <div className="hero-orbit" aria-hidden="true">
            <span className="orbit-ring orbit-ring-one" /><span className="orbit-ring orbit-ring-two" />
            <span className="hero-code"><i /><i /><i /><i /><i /><i /><i /></span>
            <span className="spark spark-one">✦</span><span className="spark spark-two">✦</span>
          </div>
        </section>

        <section className="workspace-grid">
          <aside className="control-stack">
            <section className="panel input-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">01 / SOURCE</p><h2>Values in</h2></div>
                <span className="line-count">{parseTextLines(sourceText).length} lines</span>
              </div>
              <label className="field-label" htmlFor="format">Code format</label>
              <select id="format" value={format} onChange={(event) => setFormat(event.target.value as BarcodeFormat)}>
                {barcodeFormats.map((item) => <option key={item} value={item}>{formatNames[item]}</option>)}
              </select>
              <label className="field-label" htmlFor="source-values">One value per line</label>
              <textarea id="source-values" value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder={'Example format:\nPRODUCT-001\nAISLE-A-04\n...'} spellCheck="false" />
              <div className="input-actions">
                <button className="button button-secondary" onClick={() => uploadRef.current?.click()} disabled={busy}>
                  <span>↥</span> Import file
                </button>
                <input ref={uploadRef} type="file" accept=".xlsx,.xls,.docx,.md,.txt" onChange={handleFile} hidden />
                <button className="button button-primary" onClick={generateFromText} disabled={busy}>
                  <span>✦</span> Create labels
                </button>
              </div>
              <p className="hint">Excel imports each non-empty cell in workbook order. Word, Markdown and TXT import each non-empty text line.</p>
            </section>

            <section className="panel output-panel">
              <div className="panel-heading compact-heading"><div><p className="eyebrow">02 / PRINT &amp; EXPORT</p><h2>Output settings</h2></div></div>
              <label className="field-label" htmlFor="profile">Printer / size</label>
              <select id="profile" value={profile.id} onChange={(event) => chooseProfile(event.target.value)}>
                {labelProfiles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                <option value="custom">Custom size</option>
              </select>
              {profile.id === 'custom' && <div className="custom-dimensions">
                <label>Width <input value={customSize.width} inputMode="decimal" onChange={(event) => setCustomSize({ ...customSize, width: event.target.value })} /><small>mm</small></label>
                <label>Height <input value={customSize.height} inputMode="decimal" onChange={(event) => setCustomSize({ ...customSize, height: event.target.value })} /><small>mm</small></label>
              </div>}
              <p className="profile-hint">{activeProfile.printerHint} · Browser printing sends the selected dimensions to any installed printer.</p>
              <div className="output-divider" />
              <div className="export-heading"><div><p className="eyebrow">FILES &amp; PRINT</p><h3>Finish the label pack</h3></div><span>{selectedLabel ? formatNames[selectedLabel.format] : 'No active label'}</span></div>
              <p className="export-copy">Files are created only in this browser session. No values are uploaded, stored or logged by this application.</p>
              <div className="action-grid">
                <button className="button button-secondary" disabled={!selectedLabel?.valid || busy} onClick={() => selectedLabel && runExport(() => exportOne(selectedLabel, 'png'), 'PNG label downloaded.')}><span>▧</span> PNG</button>
                <button className="button button-secondary" disabled={!selectedLabel?.valid || busy} onClick={() => selectedLabel && runExport(() => exportOne(selectedLabel, 'svg'), 'SVG label downloaded.')}><span>◇</span> SVG</button>
                <button className="button button-secondary" disabled={!validLabels.length || busy} onClick={() => runExport(() => exportPdf(validLabels, activeProfile), 'PDF label pack downloaded.')}><span>▤</span> PDF pack</button>
                <button className="button button-secondary" disabled={!validLabels.length || busy} onClick={() => runExport(() => exportZip(validLabels), 'ZIP with PNG and SVG labels downloaded.')}><span>⇩</span> ZIP pack</button>
                <button className="button button-primary print-button" disabled={!validLabels.length || busy} onClick={printLabels}><span>⎙</span> Print labels</button>
              </div>
            </section>
          </aside>

          <section className="review-stack">
            <section className="panel scan-panel">
              <div className="panel-heading scan-heading">
                <div><p className="eyebrow">03 / SCAN MODE</p><h2>Scan one label</h2></div>
                <span className="scan-count">{scanLabel ? `${scanIndex + 1} / ${filteredLabels.length}` : `0 / ${filteredLabels.length}`}</span>
              </div>
              <label className="field-label" htmlFor="scan-search">Find a code</label>
              <div className="scan-search-row"><input id="scan-search" value={scanQuery} onChange={(event) => updateScanQuery(event.target.value)} placeholder="Search any part, e.g. ff or 2026" spellCheck="false" />{scanQuery && <button className="clear-search" onClick={() => setScanQuery('')} aria-label="Clear barcode search">×</button>}</div>
              <p className="scan-hint">The search matches any part of a code. Use the arrows to show one matching label at a time for scanning.</p>
              {scanLabel ? <div className="scan-stage">
                <button className="scan-step" onClick={() => moveScan(-1)} disabled={scanIndex <= 0} aria-label="Show previous barcode">←</button>
                <article className={`scan-card ${!scanLabel.valid ? 'invalid' : ''}`}>
                  <div><span className="format-chip">{formatNames[scanLabel.format]}</span><p className="eyebrow">READY TO SCAN</p><h3 title={scanLabel.value}>{scanLabel.value}</h3></div>
                  <BarcodePreview label={scanLabel} />
                </article>
                <button className="scan-step" onClick={() => moveScan(1)} disabled={scanIndex >= filteredLabels.length - 1} aria-label="Show next barcode">→</button>
              </div> : <div className="scan-empty"><span>⌕</span><h3>No matching code</h3><p>Try a shorter part of the barcode or clear the search.</p></div>}
            </section>

            <section className="panel label-area">
              <div className="panel-heading labels-heading">
                <div><p className="eyebrow">04 / ALL LABELS</p><h2>Label queue</h2></div>
                <div className="queue-summary"><b>{filteredLabels.length}</b> shown <span /> <b>{validLabels.length}</b> valid <span /> <b className={invalidLabels ? 'warning' : ''}>{invalidLabels}</b> flagged</div>
              </div>
              <div className="label-grid" aria-live="polite">
                {!labels.length && <div className="empty-state"><span className="empty-icon">▦</span><h3>Your label queue is waiting</h3><p>Add your values above or import an Excel, Word, Markdown or text file.</p></div>}
                {!!labels.length && !filteredLabels.length && <div className="empty-state queue-empty"><span className="empty-icon">⌕</span><h3>No matching labels</h3><p>Clear the search or try a different part of the code.</p></div>}
                {filteredLabels.map((label) => {
                  const index = labels.findIndex((item) => item.id === label.id)
                  return <button key={label.id} className={`label-card ${label.id === selectedLabel?.id ? 'selected' : ''} ${!label.valid ? 'invalid' : ''}`} onClick={() => setSelectedId(label.id)}>
                    <span className="label-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="format-chip">{formatNames[label.format]}</span>
                    <BarcodePreview label={label} compact />
                    <span className="label-value" title={label.value}>{label.value}</span>
                    {!label.valid && <span className="validation-message">{label.error}</span>}
                  </button>
                })}
              </div>
            </section>
          </section>
        </section>

        <p className="status-line" role="status"><span className={busy ? 'status-pulse' : 'status-dot'} />{busy ? 'Working locally…' : notice}</p>
      </main>

      <footer><span>Warehouse Barcode Studio</span><span>Designed for careful scanning, not data collection.</span></footer>
    </div>
  )
}
