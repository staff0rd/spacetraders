import { SystemContext } from "machines/MarketContext";

export const getLocations = (systems: SystemContext) =>
  Object.keys(systems)
    .map((systemSymbol) =>
      Object.keys(systems[systemSymbol]).map(
        (key) => systems[systemSymbol][key]
      )
    )
    .flat();
export const getLocationName = (systems: SystemContext, symbol?: string) =>
  symbol
    ? getLocations(systems).find((lo) => lo.symbol === symbol)?.name
    : symbol;
