import { MarketContext } from "../../machines/MarketContext";
import { Location } from "../../api/Location";

export const getLocation = (symbol: string): Location => {
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

export const cacheLocation = (location: Location) => {
  const locations: MarketContext =
    JSON.parse(localStorage.getItem("locations")!) || {};

  const existing = locations[location.symbol];
  if (existing && existing.marketplace && !location.marketplace) {
    location.marketplace = existing.marketplace;
  }

  locations[location.symbol] = location;

  localStorage.setItem("locations", JSON.stringify(locations));
};
