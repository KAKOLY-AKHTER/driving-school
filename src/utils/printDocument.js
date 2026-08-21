const PRINT_STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 40px; color: #1a2332; background: #fff; font-family: Arial, sans-serif; }
  main { width: min(100%, 820px); margin: 0 auto; }
  h1 { margin: 0; padding-bottom: 10px; border-bottom: 3px solid #0145a8; color: #0a1628; font-size: 22px; }
  .subtitle { margin: 10px 0 24px; color: #334155; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }
  th { width: 180px; color: #475569; background: #f8fafc; font-weight: 700; }
  footer { margin-top: 36px; color: #334155; font-size: 12px; }
  @media print { body { padding: 0; } }
`

/**
 * Opens a printable, text-only document without interpolating untrusted values
 * into HTML. Returns false when the browser blocks the popup.
 */
export function openPrintableDocument({ title, heading, subtitle, rows, autoPrint = false }) {
  const popup = window.open('', '_blank', 'width=900,height=720')
  if (!popup) return false

  popup.opener = null
  const doc = popup.document
  doc.documentElement.lang = 'en'

  const titleNode = doc.createElement('title')
  titleNode.textContent = String(title || 'Document')
  const style = doc.createElement('style')
  style.textContent = PRINT_STYLES
  doc.head.replaceChildren(titleNode, style)

  const main = doc.createElement('main')
  const headingNode = doc.createElement('h1')
  headingNode.textContent = String(heading || 'A Precision Driving School')
  main.appendChild(headingNode)

  if (subtitle) {
    const subtitleNode = doc.createElement('p')
    subtitleNode.className = 'subtitle'
    subtitleNode.textContent = String(subtitle)
    main.appendChild(subtitleNode)
  }

  const table = doc.createElement('table')
  const tbody = doc.createElement('tbody')
  for (const [label, value] of rows || []) {
    const row = doc.createElement('tr')
    const labelCell = doc.createElement('th')
    const valueCell = doc.createElement('td')
    labelCell.scope = 'row'
    labelCell.textContent = String(label)
    valueCell.textContent = value === null || value === undefined || value === '' ? '—' : String(value)
    row.append(labelCell, valueCell)
    tbody.appendChild(row)
  }
  table.appendChild(tbody)
  main.appendChild(table)

  const footer = doc.createElement('footer')
  footer.textContent = 'A Precision Driving School · San Ramon, California'
  main.appendChild(footer)
  doc.body.replaceChildren(main)

  popup.focus()
  if (autoPrint) window.setTimeout(() => popup.print(), 100)
  return true
}
