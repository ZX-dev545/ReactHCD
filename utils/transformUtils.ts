export interface Point2D {
  x: number;
  y: number;
}

/**
 * Applies a 2D affine transform to each point.
 * 
 * @param points  array of points to transform
 * @param matrix  [a, b, c, d, tx, ty] representing:
 *                x' = a*x + c*y + tx
 *                y' = b*x + d*y + ty
 * @returns       new array of transformed points
 */
export function transformPoints(
  points: Point2D[],
  matrix: [number, number, number, number, number, number]
): Point2D[] {
  const [a, b, c, d, tx, ty] = matrix;
  return points.map(({ x, y }) => ({
    x: a * x + c * y + tx,
    y: b * x + d * y + ty
  }));
}
