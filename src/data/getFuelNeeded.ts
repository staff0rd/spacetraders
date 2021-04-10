const shipPenalty = (shipType: string) => {
  switch (shipType) {
    case "GR-MK-II":
      return 1;
    default:
      return 0;
  }
};

export const getFuelNeeded = (
  distance: number,
  locationType: string,
  shipType: string
) =>
  Math.round(
    Math.round(distance) / 4 +
      (locationType === "PLANET" ? 2 : 0) +
      1 +
      shipPenalty(shipType)
  );
