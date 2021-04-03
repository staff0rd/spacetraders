export const getFuelNeeded = (distance: number, type: string) =>
  Math.round(Math.round(distance) / 4 + (type === "PLANET" ? 2 : 0) + 1);
