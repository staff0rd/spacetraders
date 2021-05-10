import { MarketContext } from "../../machines/MarketContext";
import { Location } from "../../api/Location";
import { Keys } from "./Keys";

const locations: MarketContext =
  JSON.parse(localStorage.getItem(Keys.Locations)!) || {};

type FuelCache = { [key: string]: { cost: number; available: number } };

export const fuelCache: FuelCache = {};

export const getLocation = (symbol: string): Location | undefined => {
  return locations[symbol];
};

export const getLocationName = (symbol: string): string | undefined => {
  const location = getLocation(symbol);
  if (location) {
    if (location.name === "Wormhole") {
      return `${location.name} ${location.symbol.substring(0, 5)}`;
    }
    return location.name;
  }
  return symbol;
};

export const getLocations = (): Location[] => {
  const result = Object.values(locations);
  return result;
};

export const getWarp = (fromSystem: string, toSystem: string) => {
  const locations = getLocations();
  const result = findWarpsFrom(locations, fromSystem, toSystem);
  if (!result.enter || !result.exit) throw new Error("Could not find warp");
  return result;
};

export const cacheLocation = (cacheThis: Location) => {
  const existing = locations[cacheThis.symbol];
  if (existing && existing.marketplace && !cacheThis.marketplace) {
    cacheThis.marketplace = existing.marketplace;
  }

  if (existing && existing.structures && !cacheThis.structures) {
    cacheThis.structures = existing.structures;
  }

  if (cacheThis.marketplace) {
    const fuel = cacheThis.marketplace.find((p) => p.symbol === "FUEL");
    if (!fuel) {
      fuelCache[cacheThis.symbol] = { available: 0, cost: 9999 };
    } else {
      fuelCache[cacheThis.symbol] = {
        available: fuel.quantityAvailable,
        cost: fuel.purchasePricePerUnit,
      };
    }
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
