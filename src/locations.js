export const DEFAULT_BOOKING_LOCATIONS = [
  ['Fremont', '94536'], ['Newark', '94560'], ['Hayward', '94541'],
  ['Union City', '94587'], ['San Lorenzo', '94580'], ['San Leandro', '94577'],
  ['Castro Valley', '94546'], ['Ashland', '94541'], ['Oakland', '94612'],
  ['Livermore', '94550'], ['Livermore', '94551'], ['Dublin', '94568'],
  ['San Ramon', '94582'], ['San Ramon', '94583'], ['Pleasanton', '94566'],
  ['Pleasanton', '94568'], ['Pleasanton', '94588'], ['Alamo', '94507'],
  ['Danville', '94506'], ['Danville', '94526'],
].map(([name, zipCode], index) => ({ name, zipCode, distance: 'Near', order: index + 1 }))
  .concat([
    ['San Jose', '95112'], ['Santa Clara', '95050'], ['Sunnyvale', '94086'],
    ['Palo Alto', '94301'], ['San Mateo', '94401'], ['Mountain View', '94040'],
    ['Cupertino', '95014'], ['Menlo Park', '94025'], ['Redwood City', '94063'],
    ['San Francisco', '94103'], ['Millbrae', '94030'], ['San Bruno', '94066'],
    ['Burlingame', '94010'], ['Hillsborough', '94010'], ['South San Francisco', '94080'],
    ['Foster City', '94404'], ['Brisbane', '94005'], ['Belmont', '94002'],
    ['Alameda', '94501'], ['Milpitas', '95035'], ['Diablo', '94528'],
  ].map(([name, zipCode], index) => ({ name, zipCode, distance: 'Long', order: index + 10 })))

export const locationDistanceLabel = (value) => String(value || '').trim().toLowerCase() === 'near'
  ? 'Near'
  : 'Long'
