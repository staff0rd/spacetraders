interface IPoint {
  x: number;
  y: number;
}

interface IRectangle extends IPoint {
  width: number;
  height: number;
}

export const distancePoint = (p1: IPoint, p2: IPoint) => {
  return distance(p1.x, p1.y, p2.x, p2.y);
};

export const distance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2);
};

export const shrink = (rect: IRectangle, by: number): IRectangle => ({
  x: rect.x + by,
  y: rect.y + by,
  width: rect.width - 2 * by,
  height: rect.height - 2 * by,
});

export const center = (
  rect: IRectangle,
  on: IPoint = { x: 0, y: 0 }
): IRectangle => ({
  x: on.x - rect.width / 2,
  y: on.y - rect.height / 2,
  width: rect.width,
  height: rect.height,
});
