export const getDistance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2);
