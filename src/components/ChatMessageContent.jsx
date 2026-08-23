import './ChatMessageContent.css'

const TABLE_DIVIDER_CELL = /^:?-{3,}:?$/
const INLINE_TOKEN = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\)|\*[^*\n]+\*)/g

const splitTableRow = (line) => line
  .trim()
  .replace(/^\|/, '')
  .replace(/\|$/, '')
  .split('|')
  .map((cell) => cell.trim())

const isTableDivider = (line = '') => {
  if (!line.includes('|')) return false
  const cells = splitTableRow(line)
  return cells.length > 0 && cells.every((cell) => TABLE_DIVIDER_CELL.test(cell))
}

const safeLink = (value) => {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

function InlineMarkdown({ text }) {
  const parts = String(text ?? '').split(INLINE_TOKEN)

  return parts.map((part, index) => {
    if (!part) return null

    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`strong-${index}`}>{part.slice(2, -2)}</strong>
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={`code-${index}`}>{part.slice(1, -1)}</code>
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/)
    if (linkMatch) {
      const href = safeLink(linkMatch[2])
      if (href) {
        return <a key={`link-${index}`} href={href} target="_blank" rel="noreferrer">{linkMatch[1]}</a>
      }
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={`em-${index}`}>{part.slice(1, -1)}</em>
    }

    return <span key={`text-${index}`}>{part}</span>
  })
}

const isBlockStart = (lines, index) => {
  const line = lines[index]?.trim() || ''
  const nextLine = lines[index + 1]?.trim() || ''

  return !line
    || /^#{1,4}\s+/.test(line)
    || /^[-*+]\s+/.test(line)
    || /^\d+\.\s+/.test(line)
    || /^>\s?/.test(line)
    || (line.includes('|') && isTableDivider(nextLine))
}

function renderBlocks(content) {
  const lines = String(content ?? '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .split('\n')
  const blocks = []

  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim()

    if (!line) {
      index += 1
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/)
    if (heading) {
      const HeadingTag = `h${Math.min(heading[1].length + 2, 6)}`
      blocks.push(
        <HeadingTag key={`heading-${index}`}>
          <InlineMarkdown text={heading[2]} />
        </HeadingTag>,
      )
      index += 1
      continue
    }

    if (line.includes('|') && isTableDivider(lines[index + 1]?.trim())) {
      const headers = splitTableRow(line)
      const rows = []
      index += 2

      while (index < lines.length && lines[index].trim().includes('|')) {
        const row = splitTableRow(lines[index])
        if (row.some(Boolean)) rows.push(row)
        index += 1
      }

      blocks.push(
        <div className="chat-markdown-table-wrap" key={`table-${index}`}>
          <table>
            <thead>
              <tr>
                {headers.map((header, cellIndex) => (
                  <th key={`header-${cellIndex}`} scope="col"><InlineMarkdown text={header} /></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {headers.map((_, cellIndex) => (
                    <td key={`cell-${cellIndex}`}><InlineMarkdown text={row[cellIndex] || ''} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    const unordered = line.match(/^[-*+]\s+(.+)$/)
    if (unordered) {
      const items = []
      while (index < lines.length) {
        const item = lines[index].trim().match(/^[-*+]\s+(.+)$/)
        if (!item) break
        items.push(item[1])
        index += 1
      }
      blocks.push(
        <ul key={`list-${index}`}>
          {items.map((item, itemIndex) => <li key={`item-${itemIndex}`}><InlineMarkdown text={item} /></li>)}
        </ul>,
      )
      continue
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/)
    if (ordered) {
      const items = []
      while (index < lines.length) {
        const item = lines[index].trim().match(/^\d+\.\s+(.+)$/)
        if (!item) break
        items.push(item[1])
        index += 1
      }
      blocks.push(
        <ol key={`list-${index}`}>
          {items.map((item, itemIndex) => <li key={`item-${itemIndex}`}><InlineMarkdown text={item} /></li>)}
        </ol>,
      )
      continue
    }

    if (/^>\s?/.test(line)) {
      const quote = []
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quote.push(lines[index].trim().replace(/^>\s?/, ''))
        index += 1
      }
      blocks.push(<blockquote key={`quote-${index}`}><InlineMarkdown text={quote.join(' ')} /></blockquote>)
      continue
    }

    const paragraph = [line]
    index += 1
    while (index < lines.length && !isBlockStart(lines, index)) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    blocks.push(<p key={`paragraph-${index}`}><InlineMarkdown text={paragraph.join(' ')} /></p>)
  }

  return blocks
}

export default function ChatMessageContent({ content }) {
  return <div className="chat-markdown">{renderBlocks(content)}</div>
}
