export interface ParsedImport {
  lines: string[]
  warnings: string[]
}

const supportedExtensions = ['xlsx', 'xls', 'docx', 'md', 'txt'] as const
export type SupportedExtension = (typeof supportedExtensions)[number]

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

export function isSupportedFile(fileName: string): fileName is `${string}.${SupportedExtension}` {
  return supportedExtensions.includes(getFileExtension(fileName) as SupportedExtension)
}

/**
 * Keeps one human-visible text line as one code value. Empty or whitespace-only
 * lines are deliberately ignored; every other line retains its text content.
 */
export function parseTextLines(text: string): string[] {
  return text
    .replace(/\uFEFF/g, '')
    .split(/\r\n|\n|\r/)
    .map((line) => line.replace(/\u00A0/g, ' ').trim())
    .filter(Boolean)
}

function parseMarkdownLines(text: string): string[] {
  return parseTextLines(text).map((line) =>
    line
      .replace(/^#{1,6}\s+/, '')
      .replace(/^[-*+]\s+/, '')
      .replace(/^\d+[.)]\s+/, '')
      .replace(/^>\s?/, '')
      .trim(),
  ).filter(Boolean)
}

async function parseExcel(data: ArrayBuffer): Promise<ParsedImport> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(data, { type: 'array', raw: false })
  const lines: string[] = []

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: false,
      blankrows: false,
      defval: '',
    })

    rows.forEach((row) => {
      row.forEach((cell) => {
        const value = String(cell ?? '').replace(/\u00A0/g, ' ').trim()
        if (value) lines.push(value)
      })
    })
  })

  return {
    lines,
    warnings: workbook.SheetNames.length > 1
      ? ['All non-empty cells from every sheet were imported in workbook order.']
      : [],
  }
}

export async function parseImportedFile(file: File): Promise<ParsedImport> {
  const extension = getFileExtension(file.name)
  if (!isSupportedFile(file.name)) {
    throw new Error(`Unsupported file type “.${extension || 'unknown'}”. Choose .xlsx, .xls, .docx, .md or .txt.`)
  }

  if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(await file.arrayBuffer())
  }

  if (extension === 'docx') {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return { lines: parseTextLines(result.value), warnings: result.messages.map((message) => message.message) }
  }

  const text = await file.text()
  return { lines: extension === 'md' ? parseMarkdownLines(text) : parseTextLines(text), warnings: [] }
}
