import { MarketContext } from "../../machines/MarketContext";
import { Location } from "../../api/Location";
import { Keys } from "./Keys";

export const getLocation = (symbol: string): Location | undefined => {
  const locations: MarketContext = JSON.parse(
    localStorage.getItem(Keys.Locations)!
  );
  return locations[symbol];
};

export const getLocations = (): Location[] => {
  const locations: MarketContext = JSON.parse(
    localStorage.getItem(Keys.Locations)!
  );
  return Object.values(locations);
};

export const getWarp = (fromSystem: string, toSystem: string) => {
  const locations = getLocations();
  const result = findWarpsFrom(locations, fromSystem, toSystem);
  if (!result.enter || !result.exit) throw new Error("Could not find warp");
  return result;
};

export const cacheLocation = (cacheThis: Location) => {
  const locations: MarketContext =
    JSON.parse(localStorage.getItem(Keys.Locations)!) || {};

  const existing = locations[cacheThis.symbol];
  if (existing && existing.marketplace && !cacheThis.marketplace) {
    cacheThis.marketplace = existing.marketplace;
  }

  if (existing && existing.structures && !cacheThis.structures) {
    cacheThis.structures = existing.structures;
  }

  locations[cacheThis.symbol] = cacheThis;

  localStorage.setItem(Keys.Locations, JSON.stringify(locations));
};

export function findWarpsFrom(
  locations: Location[],
  fromSystem: string,
  toSystem: string
) {
  return {
    enter: locations.find((p) =>
      p.symbol.startsWith(`${fromSystem}-${toSystem}-`)
    )!,
    exit: locations.find((p) =>
      p.symbol.startsWith(`${toSystem}-${fromSystem}-`)
    )!,
  };
}
