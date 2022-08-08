export const lineIntersects = (
  a: number,
  b: number,
  c: number,
  d: number,
  p: number,
  q: number,
  r: number,
  s: number
) => {
  const det = (c - a) * (s - q) - (r - p) * (d - b)
  if (det === 0) {
    return false
  } else {
    const lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det
    const gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det
    return 0 < lambda && lambda < 1 && 0 < gamma && gamma < 1
  }
}

type Point = {
  x: number
  y: number
}

export const polygonIntersects = (polygonA: Point[], polygonB: Point[]) => {
  const polygons = [polygonA, polygonB]
  for (const polygon of polygons) {
    for (let i1 = 0; i1 < polygon.length; i1++) {
      const i2 = (i1 + 1) % polygon.length
      const p1 = polygon[i1]
      const p2 = polygon[i2]
      const px = p1.x - p2.x
      const py = p2.y - p1.y
      let minA = null
      let maxA = null

      for (const p of polygonA) {
        const projected = px * p.x + py * p.y
        if (minA == null || projected < minA) {
          minA = projected
        }
        if (maxA == null || projected > maxA) {
          maxA = projected
        }
      }

      let minB = null
      let maxB = null

      for (const p of polygonB) {
        const projected = px * p.x + py * p.y
        if (minB == null || projected < minB) {
          minB = projected
        }
        if (maxB == null || projected > maxB) {
          maxB = projected
        }
      }

      if (maxA && maxB && minA && minB && (maxA < minB || maxB < minA)) {
        return false
      }
    }
    return true
  }
}
