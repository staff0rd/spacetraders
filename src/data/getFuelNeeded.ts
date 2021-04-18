import { Location } from "api/Location";
import { distancePoint } from "components/Locations/Map/geometry";
import { getWarp } from "./localStorage/locationCache";

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

export const getLocationFuelNeeded = (
  from: Location,
  to: Location,
  shipType: string
) => {
  const fromSystem = from.symbol.substring(0, 2);
  const toSystem = to.symbol.substring(0, 2);
  if (fromSystem === toSystem)
    return getFuelNeeded(distancePoint(from, to), from.type, to.type, shipType);
  const warps = getWarp(fromSystem, toSystem);
  return (
    getFuelNeeded(
      distancePoint(from, warps.enter),
      from.type,
      warps.enter.type,
      shipType
    ) +
    getFuelNeeded(
      distancePoint(to, warps.exit),
      warps.exit.type,
      to.type,
      shipType
    )
  );
};

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
