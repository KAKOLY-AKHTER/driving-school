import nodemailer from 'nodemailer'

const USER = process.env.EMAIL_USER || ''
const PASS = process.env.EMAIL_PASS || ''
const ADMIN = process.env.ADMIN_EMAIL || USER

const transporter = USER && PASS
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: USER, pass: PASS },
    })
  : null

export function mailEnabled() {
  return !!transporter
}

const SLOTS = {
  slot1: 'Morning 1 (9-11 AM)',
  slot2: 'Morning 2 (11 AM-1 PM)',
  slot3: 'Afternoon 1 (2-4 PM)',
  slot4: 'Afternoon 2 (4-6 PM)',
}

export function slotLabel(slot) {
  return SLOTS[slot] || slot || '—'
}

function baseStyles() {
  return `
    body { margin: 0; padding: 0; background: #F8FAFD; font-family: Arial, Helvetica, sans-serif; }
    .wrap { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E2EBF5; }
    .head { background: #0a1628; padding: 32px 40px; }
    .head .brand { color: #FDBC01; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
    .head .sub { color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 6px; letter-spacing: 2px; text-transform: uppercase; }
    .body { padding: 36px 40px; color: #1a2332; }
    .body h1 { font-size: 22px; margin: 0 0 16px; color: #0145A8; }
    .body p { font-size: 14px; line-height: 1.7; color: #334155; margin: 0 0 16px; }
    .box { background: #F0F6FF; border-left: 4px solid #0145A8; border-radius: 10px; padding: 16px 20px; margin: 0 0 20px; }
    .box p { margin: 6px 0; font-size: 13.5px; color: #1a2332; }
    .box .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 2px; }
    .foot { background: #0a1628; padding: 20px 40px; color: rgba(255,255,255,0.55); font-size: 12px; line-height: 1.7; text-align: center; }
  `
}

function layout(title, bodyHtml) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      <style>${baseStyles()}</style>
    </head>
    <body>
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 16px;"><tr><td>
        <div class="wrap">
          <div class="head">
            <div class="brand">A Precision Driving School</div>
            <div class="sub">San Ramon, CA &bull; Fully Bonded, Licensed &amp; Insured</div>
          </div>
          <div class="body">${bodyHtml}</div>
          <div class="foot">
            2001 Omega Rd, Ste 205, San Ramon, CA 94583<br/>
            +1 925-329-1736 &bull; aprecisiondrivingschool@gmail.com
          </div>
        </div>
      </td></tr></table>
    </body>
    </html>
  `
}

export async function sendMail({ to, subject, html }) {
  if (!transporter) {
    console.log(`[mail skipped] to=${to} subject="${subject}" — EMAIL_USER/EMAIL_PASS not configured`)
    return false
  }
  if (!to) return false
  try {
    await transporter.sendMail({
      from: `"A Precision Driving School" <${USER}>`,
      to,
      subject,
      html,
    })
    return true
  } catch (e) {
    console.error('[mail send failed]', e.message)
    return false
  }
}

export function sendBookingConfirmation({ to, date, timeSlot }) {
  const dateLabel = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '—'
  return sendMail({
    to,
    subject: 'Your Driving Lesson Booking Confirmed — A Precision Driving School',
    html: layout('Booking Confirmed', `
      <h1>Booking Confirmed!</h1>
      <p>Hi there,</p>
      <p>Your behind-the-wheel driving lesson has been scheduled. Here are your booking details:</p>
      <div class="box">
        <p class="label">Lesson Date</p>
        <p>${dateLabel}</p>
        <p class="label">Time Slot</p>
        <p>${slotLabel(timeSlot)}</p>
      </div>
      <p>Please arrive at the pickup location a few minutes early. If you need to reschedule or have any questions, just text us at <strong>+1 925-329-1736</strong>.</p>
      <p>See you on the road!</p>
    `),
  })
}

export function sendEnrollmentConfirmation({ to, courseTitle, price }) {
  return sendMail({
    to,
    subject: 'Enrollment Confirmed — A Precision Driving School',
    html: layout('Enrollment Confirmed', `
      <h1>Welcome! You're Enrolled.</h1>
      <p>Hi there,</p>
      <p>We've received your enrollment. Here are your package details:</p>
      <div class="box">
        <p class="label">Package</p>
        <p>${courseTitle || 'Driving Course'}</p>
        ${price ? `<p class="label">Price</p><p>${price}</p>` : ''}
      </div>
      <p>One of our team members will contact you shortly to confirm your next steps. For any questions, text us at <strong>+1 925-329-1736</strong>.</p>
      <p>We can't wait to help you become a confident driver!</p>
    `),
  })
}

export function sendContactNotification({ firstName, lastName, phone, email, comments }) {
  return sendMail({
    to: ADMIN,
    subject: 'New Contact Form Submission — A Precision Driving School',
    html: layout('New Contact Message', `
      <h1>New Contact Request</h1>
      <p>A visitor just submitted the contact form on the website.</p>
      <div class="box">
        <p class="label">Name</p>
        <p>${firstName || ''} ${lastName || ''}</p>
        <p class="label">Phone</p>
        <p>${phone || '—'}</p>
        <p class="label">Email</p>
        <p>${email || '—'}</p>
        <p class="label">Message</p>
        <p>${comments || '—'}</p>
      </div>
      <p>Reply to this customer as soon as possible.</p>
    `),
  })
}
