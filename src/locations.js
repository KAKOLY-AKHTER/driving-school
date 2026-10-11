export const DEFAULT_BOOKING_LOCATIONS = [
  ['Livermore', '94550'], ['Livermore', '94551'], ['Dublin', '94568'],
  ['San Ramon', '94582'], ['San Ramon', '94583'], ['Pleasanton', '94566'],
  ['Pleasanton', '94568'], ['Pleasanton', '94588'], ['Alamo', '94507'],
  ['Danville', '94506'], ['Danville', '94526'],
].map(([name, zipCode], index) => ({ name, zipCode, distance: 'Near', order: index + 1 }))
  .concat([
    ['Diablo', '94528'],
  ].map(([name, zipCode], index) => ({ name, zipCode, distance: 'Long', order: index + 10 })))

export const locationDistanceLabel = (value) => String(value || '').trim().toLowerCase() === 'near'
  ? 'Near'
  : 'Long'
