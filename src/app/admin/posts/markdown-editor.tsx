'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { PostContent } from '@/components/post-content'
import { useImagePicker } from '@/components/image-upload-dialog'

type Tool =
  | { label: string; title: string; kind: 'wrap'; before: string; after: string; placeholder: string }
  | { label: string; title: string; kind: 'prefix'; prefix: string; ordered?: boolean }

const TOOLS: Tool[] = [
  { label: 'B', title: 'Bold  (Ctrl+B)', kind: 'wrap', before: '**', after: '**', placeholder: 'bold text' },
  { label: 'I', title: 'Italic  (Ctrl+I)', kind: 'wrap', before: '*', after: '*', placeholder: 'italic text' },
  { label: '<>', title: 'Inline code', kind: 'wrap', before: '`', after: '`', placeholder: 'code' },
  { label: 'H2', title: 'Heading', kind: 'prefix', prefix: '## ' },
  { label: 'H3', title: 'Subheading', kind: 'prefix', prefix: '### ' },
  { label: '“ ”', title: 'Quote', kind: 'prefix', prefix: '> ' },
  { label: '• List', title: 'Bulleted list', kind: 'prefix', prefix: '- ' },
  { label: '1. List', title: 'Numbered list', kind: 'prefix', prefix: '1. ', ordered: true },
  { label: 'Link', title: 'Link  (Ctrl+K)', kind: 'wrap', before: '[', after: '](https://)', placeholder: 'link text' },
]

export function MarkdownEditor({ name, defaultValue = '' }: { name: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue)
  const [showPreview, setShowPreview] = useState(true)
  const ref = useRef<HTMLTextAreaElement>(null)
  const pendingSelection = useRef<[number, number] | null>(null)

  // Restore the caret after React has committed the new value to the DOM.
  useLayoutEffect(() => {
    const selection = pendingSelection.current
    if (!selection || !ref.current) return
    pendingSelection.current = null
    ref.current.focus()
    ref.current.setSelectionRange(selection[0], selection[1])
  })

  function commit(next: string, selectionStart: number, selectionEnd: number) {
    pendingSelection.current = [selectionStart, selectionEnd]
    setValue(next)
  }

  function applyWrap(tool: Extract<Tool, { kind: 'wrap' }>) {
    const el = ref.current
    if (!el) return
    const { selectionStart: start, selectionEnd: end } = el
    const selected = value.slice(start, end)

    // Pressing the button on already-marked text removes the markers.
    const wrapsSelection =
      value.slice(start - tool.before.length, start) === tool.before &&
      value.slice(end, end + tool.after.length) === tool.after
    if (wrapsSelection) {
      const next =
        value.slice(0, start - tool.before.length) + selected + value.slice(end + tool.after.length)
      const bodyStart = start - tool.before.length
      commit(next, bodyStart, bodyStart + selected.length)
      return
    }

    const body = selected || tool.placeholder
    const next = value.slice(0, start) + tool.before + body + tool.after + value.slice(end)

    // With no selection, highlight the placeholder so it can be typed over.
    const bodyStart = start + tool.before.length
    commit(next, bodyStart, bodyStart + body.length)
  }

  function applyPrefix(tool: Extract<Tool, { kind: 'prefix' }>) {
    const el = ref.current
    if (!el) return
    const { selectionStart: start, selectionEnd: end } = el

    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const lineEndIndex = value.indexOf('\n', end)
    const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex

    const lines = value.slice(lineStart, lineEnd).split('\n')
    const allPrefixed = lines.every((line) => line.startsWith(tool.prefix))

    const updated = lines.map((line, i) => {
      if (allPrefixed) return line.slice(tool.prefix.length)
      const prefix = tool.ordered ? `${i + 1}. ` : tool.prefix
      return prefix + line
    })

    const block = updated.join('\n')
    const next = value.slice(0, lineStart) + block + value.slice(lineEnd)
    commit(next, lineStart, lineStart + block.length)
  }

  function runTool(tool: Tool) {
    if (tool.kind === 'wrap') applyWrap(tool)
    else applyPrefix(tool)
  }

  // Inserts the uploaded image on its own line, so it renders as a block.
  function insertImage(url: string) {
    const el = ref.current
    if (!el) return

    const { selectionStart: start, selectionEnd: end } = el
    const alt = value.slice(start, end) || 'Image'
    const before = value.slice(0, start)
    const after = value.slice(end)

    const leadingBreak = !before || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
    const trailingBreak = after.startsWith('\n') || !after ? '' : '\n\n'
    const snippet = `${leadingBreak}![${alt}](${url})${trailingBreak}`

    // Select the alt text so it can be typed over straight away.
    const altStart = start + leadingBreak.length + 2
    commit(before + snippet + after, altStart, altStart + alt.length)
  }

  const imagePicker = useImagePicker({ onUploaded: insertImage })

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!event.ctrlKey && !event.metaKey) return
    const shortcuts: Record<string, string> = { b: 'B', i: 'I', k: 'Link' }
    const label = shortcuts[event.key.toLowerCase()]
    if (!label) return

    event.preventDefault()
    runTool(TOOLS.find((tool) => tool.label === label)!)
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1 rounded-t border border-border bg-[color-mix(in_srgb,var(--muted)_7%,transparent)] px-2 py-1.5">
        {TOOLS.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={tool.title}
            // Keep focus (and the selection) in the textarea when the button is pressed.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runTool(tool)}
            className="rounded px-2 py-1 text-sm text-muted hover:bg-[color-mix(in_srgb,var(--muted)_18%,transparent)] hover:text-foreground"
          >
            {tool.label}
          </button>
        ))}

        <button
          type="button"
          title="Insert image"
          onMouseDown={(event) => event.preventDefault()}
          onClick={imagePicker.open}
          className="rounded px-2 py-1 text-sm text-muted hover:bg-[color-mix(in_srgb,var(--muted)_18%,transparent)] hover:text-foreground"
        >
          Image
        </button>

        <button
          type="button"
          onClick={() => setShowPreview((shown) => !shown)}
          aria-pressed={showPreview}
          className="ml-auto rounded px-2 py-1 text-sm text-muted hover:bg-[color-mix(in_srgb,var(--muted)_18%,transparent)] hover:text-foreground"
        >
          {showPreview ? 'Hide preview' : 'Show preview'}
        </button>
      </div>

      <div className={showPreview ? 'grid gap-4 lg:grid-cols-2' : ''}>
        <textarea
          ref={ref}
          id="content"
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          required
          spellCheck
          className="min-h-112 w-full resize-y rounded border border-border bg-transparent px-3 py-2 font-mono text-sm leading-relaxed outline-none focus:border-accent"
        />

        {showPreview && (
          <div className="min-h-112 overflow-auto rounded border border-dashed border-border px-4 py-3">
            {value.trim() ? (
              <PostContent content={value} />
            ) : (
              <p className="text-sm text-muted">Preview appears here as you write.</p>
            )}
          </div>
        )}
      </div>

      {imagePicker.elements}
    </div>
  )
}
