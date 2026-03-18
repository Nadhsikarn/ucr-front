export type BBox = [minLng: number, minLat: number, maxLng: number, maxLat: number]

export function computeBBox(coordinates: number[][][]): BBox {
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity
  for (const line of coordinates) {
    for (const [lng, lat] of line) {
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    }
  }
  return [minLng, minLat, maxLng, maxLat]
}

export function computeCentroid(coordinates: number[][][]): [number, number] {
  let sumLng = 0,
    sumLat = 0,
    count = 0
  for (const line of coordinates) {
    for (const [lng, lat] of line) {
      sumLng += lng
      sumLat += lat
      count++
    }
  }
  return [sumLng / count, sumLat / count]
}

export function midpoint(coords: number[][]): [number, number] {
  const mid = Math.floor(coords.length / 2)
  return [coords[mid][0], coords[mid][1]]
}
