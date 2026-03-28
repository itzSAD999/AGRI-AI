import { useCallback, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

type Props = {
  onContent: (content: string, fileName: string) => void
  accept?: string
  label?: string
  className?: string
}

const MAX_SIZE_MB = 10

const ALLOWED_EXTENSIONS = ['.txt', '.md', '.csv', '.json', '.pdf', '.docx', '.doc']

async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    if (text.trim()) pages.push(text)
  }
  if (pages.length === 0) {
    return `[PDF: ${file.name}] — Could not extract text. The PDF may be image-based. Try a text-based PDF or paste the content manually.`
  }
  return pages.join('\n\n--- Page break ---\n\n')
}

async function extractDocxText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const zip = buffer
  try {
    const { entries } = await parseZip(new Uint8Array(zip))
    const docXml = entries['word/document.xml']
    if (!docXml) return `[DOCX: ${file.name}] — Could not read document content.`
    const text = new TextDecoder().decode(docXml)
    return text
      .replace(/<w:p[^>]*>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  } catch {
    return `[DOCX: ${file.name}] — Text extraction failed. Try pasting the content manually or using a .txt file.`
  }
}

async function parseZip(data: Uint8Array): Promise<{ entries: Record<string, Uint8Array> }> {
  const entries: Record<string, Uint8Array> = {}
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  let offset = 0

  while (offset < data.length - 4) {
    const sig = view.getUint32(offset, true)
    if (sig !== 0x04034b50) break // local file header

    const compMethod = view.getUint16(offset + 8, true)
    const compSize = view.getUint32(offset + 18, true)
    const uncompSize = view.getUint32(offset + 22, true)
    const nameLen = view.getUint16(offset + 26, true)
    const extraLen = view.getUint16(offset + 28, true)

    const name = new TextDecoder().decode(data.subarray(offset + 30, offset + 30 + nameLen))
    const fileData = data.subarray(offset + 30 + nameLen + extraLen, offset + 30 + nameLen + extraLen + compSize)

    if (compMethod === 0 && uncompSize > 0) {
      entries[name] = fileData
    } else if (compMethod === 8) {
      try {
        const ds = new DecompressionStream('deflate-raw')
        const writer = ds.writable.getWriter()
        const reader = ds.readable.getReader()
        writer.write(new Uint8Array(fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength)) as unknown as BufferSource).catch(() => {})
        writer.close().catch(() => {})
        const chunks: Uint8Array[] = []
        let done = false
        while (!done) {
          const result = await reader.read()
          if (result.done) { done = true } else { chunks.push(result.value) }
        }
        const total = chunks.reduce((s, c) => s + c.length, 0)
        const merged = new Uint8Array(total)
        let pos = 0
        for (const c of chunks) { merged.set(c, pos); pos += c.length }
        entries[name] = merged
      } catch { /* skip unreadable entries */ }
    }

    offset += 30 + nameLen + extraLen + compSize
  }
  return { entries }
}

async function readFile(file: File): Promise<string> {
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    return extractPdfText(file)
  }
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.endsWith('.docx')
  ) {
    return extractDocxText(file)
  }
  if (file.name.endsWith('.doc')) {
    return `[DOC: ${file.name}] — Legacy .doc format is not supported. Please save as .docx or .txt and re-upload.`
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export function FileUpload({ onContent, accept, label, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const processFile = useCallback(
    async (file: File) => {
      setError(null)
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`File too large (max ${MAX_SIZE_MB} MB).`)
        return
      }
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!ALLOWED_EXTENSIONS.includes(ext) && !file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
        setError('Unsupported file type. Use .txt, .md, .csv, .json, .pdf, or .docx.')
        return
      }
      try {
        setProcessing(true)
        const text = await readFile(file)
        onContent(text, file.name)
      } catch {
        setError('Could not read the file.')
      } finally {
        setProcessing(false)
      }
    },
    [onContent],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) void processFile(file)
    },
    [processFile],
  )

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) void processFile(file)
      if (inputRef.current) inputRef.current.value = ''
    },
    [processFile],
  )

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed px-4 py-5 text-center text-sm transition-colors ${
          dragging
            ? 'border-[#2dd4bf]/60 bg-[#2dd4bf]/5'
            : 'border-white/15 bg-white/[0.02] hover:border-white/25'
        }`}
      >
        {processing ? (
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#2dd4bf]" />
            Extracting text...
          </div>
        ) : (
          <>
            <p className="text-slate-400">
              {label ?? 'Drop a file here or '}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="font-medium text-[#2dd4bf] hover:underline"
              >
                browse
              </button>
            </p>
            <p className="mt-1 text-xs text-slate-600">.pdf, .docx, .txt, .md, .csv, .json — max {MAX_SIZE_MB} MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept ?? '.txt,.md,.csv,.json,.pdf,.docx,.doc'}
          onChange={onChange}
          className="hidden"
        />
      </div>
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
    </div>
  )
}
