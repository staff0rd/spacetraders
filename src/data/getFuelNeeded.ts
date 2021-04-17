const shipPenalty = (shipType: string) => {
  switch (shipType) {
    case "GR-MK-II":
      return 1;
    case "GR-MK-III":
      return 2;
    default:
      return 0;
  }
};

export const shouldWarp = (fromType: string, toType: string) =>
  fromType === "WORMHOLE" && toType === "WORMHOLE";

export const getFuelNeeded = (
  distance: number,
  fromType: string,
  toType: string,
  shipType: string
) => {
  if (shouldWarp(fromType, toType)) return 0;
  return Math.round(
    Math.round(distance) / 4 +
      (fromType === "PLANET" ? 2 : 0) +
      1 +
      shipPenalty(shipType)
  );
};
