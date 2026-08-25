const CALIFORNIA_TIME_ZONE = 'America/Los_Angeles'

const DEFAULT_DURATION_HOURS = 2

const pad = value => String(value).padStart(2, '0')

const validDateKey = value => {
  const match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return ''
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const check = new Date(Date.UTC(year, month - 1, day))
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day
    ? `${match[1]}-${match[2]}-${match[3]}`
    : ''
}

const addDays = (dateKey, days) => {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

const parseClock = value => {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return null
  const hour12 = Number(match[1])
  const minute = Number(match[2])
  if (hour12 < 1 || hour12 > 12 || minute < 0 || minute > 59) return null
  let hour = hour12 % 12
  if (match[3].toUpperCase() === 'PM') hour += 12
  return { hour, minute, totalMinutes: hour * 60 + minute }
}

const timeRange = (value, durationHours = DEFAULT_DURATION_HOURS) => {
  const matches = [...String(value || '').matchAll(/(\d{1,2}:\d{2}\s*(?:AM|PM))/gi)]
  const start = parseClock(matches[0]?.[1])
  if (!start) return null
  const configuredDuration = Number(durationHours)
  const durationMinutes = Number.isFinite(configuredDuration) && configuredDuration > 0
    ? Math.round(configuredDuration * 60)
    : DEFAULT_DURATION_HOURS * 60
  const end = parseClock(matches[1]?.[1]) || {
    totalMinutes: start.totalMinutes + durationMinutes,
  }
  let endMinutes = end.totalMinutes
  if (endMinutes <= start.totalMinutes) endMinutes += 24 * 60
  return { startMinutes: start.totalMinutes, endMinutes }
}

const compactDateTime = (dateKey, totalMinutes) => {
  const dayOffset = Math.floor(totalMinutes / (24 * 60))
  const minutesInDay = totalMinutes % (24 * 60)
  const resolvedDate = addDays(dateKey, dayOffset)
  return `${resolvedDate.replaceAll('-', '')}T${pad(Math.floor(minutesInDay / 60))}${pad(minutesInDay % 60)}00`
}

const escapeIcs = value => String(value || '')
  .replaceAll('\\', '\\\\')
  .replaceAll('\n', '\\n')
  .replaceAll(',', '\\,')
  .replaceAll(';', '\\;')

const safeFilePart = value => String(value || 'driving-lesson')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60) || 'driving-lesson'

const courseForBooking = (booking, courses = []) => {
  const enrollmentId = String(booking?.enrollmentId || '')
  if (enrollmentId) {
    const enrollment = courses.find(course => String(course?.enrollmentId || '') === enrollmentId)
    if (enrollment) return enrollment
  }
  return courses.find(course => String(course?.id || '') === String(booking?.courseId || '')) || null
}

export const bookingCalendarDetails = (booking, courses = [], displayTime = '', context = {}) => {
  const dateKey = validDateKey(booking?.date)
  const timeText = String(displayTime || booking?.timeSlot || booking?.time || '').trim()
  const range = timeRange(timeText, booking?.hours)
  if (!dateKey || !range) return null

  const course = courseForBooking(booking, courses)
  const planName = String(course?.title || course?.planName || booking?.courseTitle || 'Driving Lesson').trim()
  const city = String(course?.city || booking?.city || '').trim()
  const cityZip = String(course?.cityZip || booking?.cityZip || '').trim()
  const location = city ? `${city}, California${cityZip ? ` ${cityZip}` : ''}` : 'A Precision Driving School, California'
  const status = String(booking?.normalizedStatus || booking?.status || 'Confirmed').trim()
  const reference = String(booking?._id || booking?.id || '').trim()
  const studentName = String(context?.studentName || '').trim()
  const studentEmail = String(context?.studentEmail || '').trim()
  const studentPhone = String(context?.studentPhone || '').trim()
  const adminEvent = context?.audience === 'admin'
  const description = [
    adminEvent && studentName ? `Student: ${studentName}.` : '',
    adminEvent && studentEmail ? `Email: ${studentEmail}.` : '',
    adminEvent && studentPhone ? `Phone: ${studentPhone}.` : '',
    `${planName} booking with A Precision Driving School.`,
    `Lesson time: ${timeText}.`,
    `Status: ${status}.`,
    reference ? `Booking reference: ${reference}.` : '',
    'Please arrive a few minutes before the scheduled lesson.',
  ].filter(Boolean).join('\n')

  return {
    title: adminEvent && studentName ? `Driving Lesson — ${studentName}` : `Driving Lesson — ${planName}`,
    description,
    location,
    dateKey,
    timeText,
    start: compactDateTime(dateKey, range.startMinutes),
    end: compactDateTime(dateKey, range.endMinutes),
    uid: reference || `${dateKey}-${range.startMinutes}-${booking?.courseId || 'lesson'}`,
    fileName: `${safeFilePart(planName)}-${dateKey}.ics`,
  }
}

export const googleCalendarUrl = (booking, courses = [], displayTime = '', context = {}) => {
  const event = bookingCalendarDetails(booking, courses, displayTime, context)
  if (!event) return ''
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${event.start}/${event.end}`,
    ctz: CALIFORNIA_TIME_ZONE,
    details: event.description,
    location: event.location,
  })
  const calendarAccount = String(context?.calendarAccount || '').trim().toLowerCase()
  if (calendarAccount) params.set('authuser', calendarAccount)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export const bookingCalendarFile = (booking, courses = [], displayTime = '') => {
  const event = bookingCalendarDetails(booking, courses, displayTime)
  if (!event) return null
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//A Precision Driving School//Lesson Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcs(event.uid)}@aprecisiondrivingschool.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${CALIFORNIA_TIME_ZONE}:${event.start}`,
    `DTEND;TZID=${CALIFORNIA_TIME_ZONE}:${event.end}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    `LOCATION:${escapeIcs(event.location)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  return { ...event, content }
}

export const downloadBookingCalendar = (booking, courses = [], displayTime = '') => {
  const calendarFile = bookingCalendarFile(booking, courses, displayTime)
  if (!calendarFile) return false
  const blob = new Blob([calendarFile.content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = calendarFile.fileName
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}
