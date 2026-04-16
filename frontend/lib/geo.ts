export type BBox = [minLng: number, minLat: number, maxLng: number, maxLat: number]

// รับได้ทั้ง LineString (number[][]) และ MultiLineString (number[][][])
export function computeBBox(coordinates: number[][] | number[][][]): BBox {
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity
  // normalize ให้เป็น number[][][] เสมอ
  const lines: number[][][] =
    Array.isArray(coordinates[0][0])
      ? (coordinates as number[][][])
      : [(coordinates as number[][])]

  for (const line of lines) {
    for (const [lng, lat] of line) {
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    }
  }
  return [minLng, minLat, maxLng, maxLat]
}

export function computeCentroid(coordinates: number[][] | number[][][]): [number, number] {
  let sumLng = 0,
    sumLat = 0,
    count = 0

  const lines: number[][][] =
    Array.isArray(coordinates[0][0])
      ? (coordinates as number[][][])
      : [(coordinates as number[][])]

  for (const line of lines) {
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
