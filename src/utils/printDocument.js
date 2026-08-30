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

// A detailed, print-friendly enrollment invoice. Browser print dialogs let staff
// save this document as a PDF without exposing any account data in a URL.
function _openPrintableEnrollmentInvoice({ school = {}, student = {}, enrollment = {}, autoPrint = true }) {
  const popup = window.open('', '_blank', 'width=920,height=780')
  if (!popup) return false

  popup.opener = null
  const doc = popup.document
  doc.documentElement.lang = 'en'
  const style = doc.createElement('style')
  style.textContent = `
    * { box-sizing: border-box; } body { margin:0; padding:36px; color:#10213D; background:#fff; font-family:Arial,sans-serif; }
    main { max-width:820px; margin:0 auto; } .top { display:flex; justify-content:space-between; gap:24px; align-items:flex-start; border-bottom:3px solid #FDBC01; padding-bottom:18px; }
    h1 { margin:0; color:#0145A8; font-family:Georgia,serif; font-size:30px; } .school { margin:6px 0 0; color:#475569; line-height:1.5; font-size:13px; }
    .badge { margin:0; padding:8px 14px; border-radius:7px; color:#fff; background:#0145A8; font-size:14px; font-weight:800; letter-spacing:.12em; }
    .invoice-id { margin:10px 0 0; color:#475569; font-size:13px; text-align:right; } .section { margin-top:24px; border:1px solid #D8E4F0; border-radius:12px; overflow:hidden; }
    h2 { margin:0; padding:10px 14px; color:#fff; background:linear-gradient(135deg,#0145A8,#0A2A5E); font-size:15px; letter-spacing:.04em; }
    .details { display:grid; grid-template-columns:1fr 1fr; gap:0 26px; padding:14px; } .details p { margin:0; padding:5px 0; font-size:13px; line-height:1.4; overflow-wrap:anywhere; }
    .details b { color:#334155; } table { width:100%; border-collapse:collapse; } th,td { padding:11px 14px; text-align:left; border-bottom:1px solid #E2E8F0; font-size:13px; } th { color:#334155; background:#F1F5F9; text-transform:uppercase; font-size:11px; letter-spacing:.08em; }
    .totals { width:290px; margin:16px 0 0 auto; } .totals p { display:flex; justify-content:space-between; gap:18px; margin:7px 0; font-size:14px; } .totals .total { padding-top:9px; border-top:2px solid #0145A8; font-size:17px; font-weight:800; color:#0145A8; }
    footer { margin-top:30px; padding-top:14px; border-top:1px solid #E2E8F0; color:#64748B; font-size:11px; line-height:1.5; } @media print { body { padding:0; } }
  `
  const title = doc.createElement('title')
  title.textContent = `Invoice ${enrollment.reference || ''}`.trim()
  doc.head.replaceChildren(title, style)

  const value = input => input === null || input === undefined || input === '' ? '—' : String(input)
  const line = (label, input) => { const p = doc.createElement('p'); const b = doc.createElement('b'); b.textContent = `${label}: `; p.append(b, value(input)); return p }
  const main = doc.createElement('main')
  const top = doc.createElement('div'); top.className = 'top'
  const schoolBlock = doc.createElement('div'); const heading = doc.createElement('h1'); heading.textContent = school.name || 'A Precision Driving School'; schoolBlock.append(heading)
  const schoolCopy = doc.createElement('p'); schoolCopy.className = 'school'; schoolCopy.textContent = [school.address, school.phone, school.email, school.website].filter(Boolean).join(' · '); schoolBlock.append(schoolCopy)
  const invoiceBlock = doc.createElement('div'); const badge = doc.createElement('p'); badge.className = 'badge'; badge.textContent = 'INVOICE'; const invoiceId = doc.createElement('p'); invoiceId.className = 'invoice-id'; invoiceId.textContent = `Invoice #: ${value(enrollment.reference)}\nIssued: ${value(enrollment.issuedAt)}`; invoiceBlock.append(badge, invoiceId); top.append(schoolBlock, invoiceBlock); main.append(top)
  const section = doc.createElement('section'); section.className = 'section'; const sectionTitle = doc.createElement('h2'); sectionTitle.textContent = 'STUDENT & ENROLLMENT INFORMATION'; const details = doc.createElement('div'); details.className = 'details'
  ;[['Student', student.name], ['Email', student.email], ['Phone', student.phone], ['Address', student.address], ['Enrollment ID', enrollment.id], ['Payment Status', enrollment.paymentStatus], ['Enrollment Status', enrollment.status], ['Enrollment Date', enrollment.enrolledAt], ['Pickup Location', enrollment.location], ['Lesson Slots', enrollment.lessonSlots]].forEach(([label, input]) => details.append(line(label, input)))
  section.append(sectionTitle, details); main.append(section)
  const tableSection = doc.createElement('section'); tableSection.className = 'section'; const tableTitle = doc.createElement('h2'); tableTitle.textContent = 'COURSE DETAILS'; const table = doc.createElement('table'); const thead = doc.createElement('thead'); const headRow = doc.createElement('tr'); ['Course', 'Price', 'Status'].forEach(text => { const th = doc.createElement('th'); th.textContent = text; headRow.append(th) }); thead.append(headRow); const tbody = doc.createElement('tbody'); const row = doc.createElement('tr'); [enrollment.course, enrollment.amount, enrollment.status].forEach(input => { const td = doc.createElement('td'); td.textContent = value(input); row.append(td) }); tbody.append(row); table.append(thead, tbody); tableSection.append(tableTitle, table); main.append(tableSection)
  const totals = doc.createElement('div'); totals.className = 'totals'; const subtotal = line('Subtotal', enrollment.amount); const tax = line('Tax', '$0.00'); const total = line('Total', enrollment.amount); total.className = 'total'; totals.append(subtotal, tax, total); main.append(totals)
  const footer = doc.createElement('footer'); footer.textContent = 'Thank you for choosing A Precision Driving School. This invoice summarizes the enrollment and payment details available at the time it was generated.'; main.append(footer)
  doc.body.replaceChildren(main); popup.focus(); if (autoPrint) window.setTimeout(() => popup.print(), 120)
  return true
}

const invoiceValue = input => input === null || input === undefined || input === '' ? 'Not recorded' : String(input)
const invoiceFileName = input => String(input || 'enrollment-invoice').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'enrollment-invoice'

const fetchImageData = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Logo unavailable')
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Creates a real PDF and downloads it directly, with no print window involved.
export async function openEnrollmentInvoice({ school = {}, student = {}, enrollment = {} }) {
  const [{ jsPDF }, logo] = await Promise.all([
    import('jspdf'),
    fetchImageData('/driving-logo.png').catch(() => null),
  ])
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 42
  const contentWidth = pageWidth - margin * 2
  const blue = [1, 69, 168]
  const navy = [10, 42, 94]
  const gold = [253, 188, 1]
  const value = invoiceValue
  const amount = value(enrollment.amount)

  pdf.setFillColor(...navy)
  pdf.rect(0, 0, pageWidth, 126, 'F')
  pdf.setFillColor(...gold)
  pdf.rect(0, 120, pageWidth, 6, 'F')
  if (logo) pdf.addImage(logo, 'PNG', margin, 26, 66, 66)
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(21)
  pdf.text(value(school.name || 'A Precision Driving School'), logo ? 120 : margin, 52)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9.5)
  pdf.text([school.address, school.phone, school.email, school.website].filter(Boolean).join('  |  '), logo ? 120 : margin, 70, { maxWidth: 300 })
  pdf.setFillColor(...blue)
  pdf.roundedRect(pageWidth - 163, 36, 121, 32, 5, 5, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(15)
  pdf.text('INVOICE', pageWidth - 102.5, 57, { align: 'center' })
  pdf.setTextColor(71, 85, 105)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9.5)
  pdf.text(`Invoice # ${value(enrollment.reference)}`, pageWidth - margin, 90, { align: 'right' })
  pdf.text(`Issued ${value(enrollment.issuedAt)}`, pageWidth - margin, 105, { align: 'right' })

  const section = (title, y) => {
    pdf.setFillColor(...blue)
    pdf.roundedRect(margin, y, contentWidth, 24, 5, 5, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text(title, margin + 12, y + 16)
    return y + 24
  }
  const detail = (label, input, x, y, width) => {
    pdf.setTextColor(51, 65, 85)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8.5)
    pdf.text(label.toUpperCase(), x, y)
    pdf.setTextColor(15, 35, 70)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.text(pdf.splitTextToSize(value(input), width), x, y + 13)
  }

  let y = 152
  y = section('STUDENT & ENROLLMENT INFORMATION', y)
  pdf.setFillColor(248, 251, 255)
  pdf.roundedRect(margin, y, contentWidth, 150, 0, 0, 'F')
  const leftX = margin + 14
  const rightX = margin + contentWidth / 2 + 8
  const detailWidth = contentWidth / 2 - 28
  const rows = [
    [['Student', student.name], ['Enrollment ID', enrollment.id]],
    [['Email', student.email], ['Payment Status', enrollment.paymentStatus]],
    [['Phone', student.phone], ['Enrollment Status', enrollment.status]],
    [['Address', student.address], ['Enrollment Date', enrollment.enrolledAt]],
    [['Pickup Location', enrollment.location], ['Lesson Slots', enrollment.lessonSlots]],
  ]
  rows.forEach((row, index) => {
    const rowY = y + 17 + index * 27
    detail(row[0][0], row[0][1], leftX, rowY, detailWidth)
    detail(row[1][0], row[1][1], rightX, rowY, detailWidth)
  })
  y += 174
  y = section('COURSE DETAILS', y)
  pdf.setFillColor(241, 245, 249)
  pdf.rect(margin, y, contentWidth, 24, 'F')
  pdf.setTextColor(51, 65, 85)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8.5)
  pdf.text('COURSE', margin + 12, y + 16)
  pdf.text('PRICE', margin + contentWidth - 165, y + 16)
  pdf.text('STATUS', margin + contentWidth - 70, y + 16)
  y += 24
  pdf.setDrawColor(226, 232, 240)
  pdf.rect(margin, y, contentWidth, 38)
  pdf.setTextColor(15, 35, 70)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text(pdf.splitTextToSize(value(enrollment.course), contentWidth - 270), margin + 12, y + 17)
  pdf.text(amount, margin + contentWidth - 165, y + 17)
  pdf.setTextColor(21, 128, 61)
  pdf.text(value(enrollment.status), margin + contentWidth - 70, y + 17)
  y += 62
  const totalsX = pageWidth - margin - 195
  pdf.setFillColor(255, 251, 235)
  pdf.roundedRect(totalsX, y, 195, 76, 7, 7, 'F')
  pdf.setTextColor(51, 65, 85)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text('Subtotal', totalsX + 14, y + 22)
  pdf.text(amount, totalsX + 181, y + 22, { align: 'right' })
  pdf.text('Tax', totalsX + 14, y + 40)
  pdf.text('$0.00', totalsX + 181, y + 40, { align: 'right' })
  pdf.setDrawColor(...gold)
  pdf.line(totalsX + 14, y + 49, totalsX + 181, y + 49)
  pdf.setTextColor(...blue)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(13)
  pdf.text('TOTAL', totalsX + 14, y + 68)
  pdf.text(amount, totalsX + 181, y + 68, { align: 'right' })
  pdf.setTextColor(100, 116, 139)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.text('Thank you for choosing A Precision Driving School. This invoice is an enrollment and payment summary.', margin, 748, { maxWidth: contentWidth })
  pdf.save(`${invoiceFileName(enrollment.reference)}-invoice.pdf`)
  return true
}
