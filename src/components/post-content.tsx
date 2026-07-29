import { Fragment, type ReactNode } from 'react'

type Block =
  | { type: 'p'; lines: string[] }
  | { type: 'heading'; level: 2 | 3 | 4; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; lines: string[] }
  | { type: 'code'; lines: string[] }
  | { type: 'hr' }

const FENCE = /^```/
const HEADING = /^(#{1,6})\s+(.*)$/
const QUOTE = /^>\s?(.*)$/
const BULLET = /^[-*+]\s+(.*)$/
const NUMBERED = /^\d+\.\s+(.*)$/
const RULE = /^(-{3,}|\*{3,}|_{3,})$/

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) {
      i++
      continue
    }

    if (FENCE.test(line)) {
      const body: string[] = []
      i++
      while (i < lines.length && !FENCE.test(lines[i])) body.push(lines[i++])
      i++ // closing fence
      blocks.push({ type: 'code', lines: body })
      continue
    }

    if (RULE.test(line.trim())) {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    const heading = line.match(HEADING)
    if (heading) {
      // The post title is the page's h1, so headings never go above h2.
      const level = Math.min(Math.max(heading[1].length, 2), 4) as 2 | 3 | 4
      blocks.push({ type: 'heading', level, text: heading[2] })
      i++
      continue
    }

    if (QUOTE.test(line)) {
      const body: string[] = []
      while (i < lines.length && QUOTE.test(lines[i])) {
        body.push(lines[i].match(QUOTE)![1])
        i++
      }
      blocks.push({ type: 'quote', lines: body })
      continue
    }

    const listPattern = BULLET.test(line) ? BULLET : NUMBERED.test(line) ? NUMBERED : null
    if (listPattern) {
      const items: string[] = []
      while (i < lines.length && listPattern.test(lines[i])) {
        items.push(lines[i].match(listPattern)![1])
        i++
      }
      blocks.push({ type: 'list', ordered: listPattern === NUMBERED, items })
      continue
    }

    const body: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !FENCE.test(lines[i]) &&
      !HEADING.test(lines[i]) &&
      !QUOTE.test(lines[i]) &&
      !BULLET.test(lines[i]) &&
      !NUMBERED.test(lines[i]) &&
      !RULE.test(lines[i].trim())
    ) {
      body.push(lines[i++])
    }
    blocks.push({ type: 'p', lines: body })
  }

  return blocks
}

// Only allow schemes that can't execute script (blocks `javascript:` hrefs).
function safeHref(url: string) {
  return /^(https?:\/\/|mailto:|\/|#)/i.test(url) ? url : '#'
}

// Images are matched before links, since `[alt](url)` is a substring of `![alt](url)`.
const INLINE =
  /(\*\*|__)([\s\S]+?)\1|(\*|_)([\s\S]+?)\3|`([^`]+)`|!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)/g

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  let key = 0

  for (const match of text.matchAll(INLINE)) {
    const start = match.index!
    if (start > last) nodes.push(text.slice(last, start))

    if (match[2] !== undefined) {
      nodes.push(<strong key={key++}>{renderInline(match[2])}</strong>)
    } else if (match[4] !== undefined) {
      nodes.push(<em key={key++}>{renderInline(match[4])}</em>)
    } else if (match[5] !== undefined) {
      nodes.push(<code key={key++}>{match[5]}</code>)
    } else if (match[7] !== undefined) {
      nodes.push(
        // eslint-disable-next-line @next/next/no-img-element
        <img key={key++} src={safeHref(match[7])} alt={match[6]} loading="lazy" />,
      )
    } else {
      nodes.push(
        <a key={key++} href={safeHref(match[9])} rel="noreferrer">
          {renderInline(match[8])}
        </a>,
      )
    }

    last = start + match[0].length
  }

  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

// Single newlines inside a paragraph become line breaks.
function renderLines(lines: string[]): ReactNode[] {
  return lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {renderInline(line)}
    </Fragment>
  ))
}

function renderBlock(block: Block, key: number) {
  switch (block.type) {
    case 'heading': {
      const Tag = `h${block.level}` as 'h2' | 'h3' | 'h4'
      return <Tag key={key}>{renderInline(block.text)}</Tag>
    }
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul'
      return (
        <Tag key={key}>
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </Tag>
      )
    }
    case 'quote':
      return <blockquote key={key}>{renderLines(block.lines)}</blockquote>
    case 'code':
      return (
        <pre key={key}>
          <code>{block.lines.join('\n')}</code>
        </pre>
      )
    case 'hr':
      return <hr key={key} />
    default:
      return <p key={key}>{renderLines(block.lines)}</p>
  }
}

export function PostContent({ content }: { content: string }) {
  return <div className="prose-content">{parseBlocks(content).map(renderBlock)}</div>
}
