import type { Point } from "@/types/customize";

type Quad = readonly [Point, Point, Point, Point];

export function getMatrix3dForQuad(sourceWidth: number, sourceHeight: number, quad: Quad) {
  const [topLeft, topRight, bottomRight, bottomLeft] = quad;
  const source: Quad = [
    { x: 0, y: 0 },
    { x: sourceWidth, y: 0 },
    { x: sourceWidth, y: sourceHeight },
    { x: 0, y: sourceHeight },
  ];

  const h = solveHomography(source, [topLeft, topRight, bottomRight, bottomLeft]);

  return `matrix3d(${[
    h[0],
    h[3],
    0,
    h[6],
    h[1],
    h[4],
    0,
    h[7],
    0,
    0,
    1,
    0,
    h[2],
    h[5],
    0,
    h[8],
  ]
    .map((value) => roundMatrixValue(value))
    .join(",")})`;
}

export function getQuadSize(quad: Quad) {
  const [topLeft, topRight, bottomRight, bottomLeft] = quad;
  return {
    width: (distance(topLeft, topRight) + distance(bottomLeft, bottomRight)) / 2,
    height: (distance(topLeft, bottomLeft) + distance(topRight, bottomRight)) / 2,
  };
}

function solveHomography(source: Quad, target: Quad) {
  const matrix: number[][] = [];

  for (let index = 0; index < source.length; index += 1) {
    const { x, y } = source[index];
    const { x: u, y: v } = target[index];

    matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }

  const solved = gaussianElimination(matrix);
  return [...solved, 1];
}

function gaussianElimination(matrix: number[][]) {
  const size = matrix.length;

  for (let column = 0; column < size; column += 1) {
    let pivot = column;

    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) {
        pivot = row;
      }
    }

    [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];

    const divisor = matrix[column][column] || 1;
    for (let entry = column; entry <= size; entry += 1) {
      matrix[column][entry] /= divisor;
    }

    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = matrix[row][column];
      for (let entry = column; entry <= size; entry += 1) {
        matrix[row][entry] -= factor * matrix[column][entry];
      }
    }
  }

  return matrix.map((row) => row[size]);
}

function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function roundMatrixValue(value: number) {
  return Number.isInteger(value) ? value : Number(value.toFixed(8));
}
