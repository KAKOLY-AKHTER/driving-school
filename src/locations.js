export const DEFAULT_BOOKING_LOCATIONS = [
  'Fremont', 'Newark', 'Hayward', 'Union City', 'San Lorenzo', 'San Leandro',
  'Castro Valley', 'Ashland', 'Oakland',
].map((name, index) => ({ name, distance: 'Near', order: index + 1 }))
  .concat([
    'San Jose', 'Santa Clara', 'Sunnyvale', 'Palo Alto', 'San Mateo', 'Mountain View',
    'Cupertino', 'Menlo Park', 'Redwood City', 'San Francisco', 'Millbrae', 'San Bruno',
    'Burlingame', 'Hillsborough', 'South San Francisco', 'Foster City', 'Brisbane',
    'Belmont', 'Alameda', 'Pleasanton', 'San Ramon', 'Milpitas',
  ].map((name, index) => ({ name, distance: 'Long', order: index + 10 })))

export const locationDistanceLabel = (value) => String(value || '').trim().toLowerCase() === 'near'
  ? 'Near'
  : 'Long'

