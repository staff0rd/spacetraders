import { MarketContext } from "../../machines/MarketContext";
import { Location } from "../../api/Location";

export const getLocation = (symbol: string): Location | undefined => {
  const locations: MarketContext = JSON.parse(
    localStorage.getItem("locations")!
  );
  return locations[symbol];
};

export const getLocations = (): Location[] => {
  const locations: MarketContext = JSON.parse(
    localStorage.getItem("locations")!
  );
  return Object.values(locations);
};

export const cacheLocation = (cacheThis: Location) => {
  const locations: MarketContext =
    JSON.parse(localStorage.getItem("locations")!) || {};

  const existing = locations[cacheThis.symbol];
  if (existing && existing.marketplace && !cacheThis.marketplace) {
    cacheThis.marketplace = existing.marketplace;
  }

  if (existing && existing.structures && !cacheThis.structures) {
    cacheThis.structures = existing.structures;
  }

  locations[cacheThis.symbol] = cacheThis;

  localStorage.setItem("locations", JSON.stringify(locations));
};
