import { Location } from "../../api/Location";

export const drawMap = (
  locations: Location[],
  parentWidth?: number,
  parentHeight?: number
) => {
  if (!parentWidth || !parentHeight) return [];

  const minX = Math.min(...locations.map((loc) => loc.x));
  const maxX = Math.max(...locations.map((loc) => loc.x));
  const minY = Math.min(...locations.map((loc) => loc.y));
  const maxY = Math.max(...locations.map((loc) => loc.y));
  const distance = (a: number, b: number) => Math.sqrt((b -= a) * b);

  const xScale = (parentWidth - 24) / distance(minX, maxX);
  const yScale = (parentHeight - 24) / distance(minY, maxY);

  const convertToWindow = ({
    x,
    y,
  }: {
    x: number;
    y: number;
  }): { x: number; y: number } => {
    return {
      x: x * xScale + Math.abs(minX * xScale),
      y: y * yScale + Math.abs(minY * yScale),
    };
  };

  const result = locations.map((l) => ({
    ...convertToWindow(l),
    location: l,
  }));

  return result;
};
