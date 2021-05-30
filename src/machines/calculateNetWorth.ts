import { SystemContext } from "./MarketContext";
import { AvailableShip } from "../api/AvailableShip";
import { NetWorthLineItem, Category } from "./NetWorthLineItem";
import { getCredits } from "data/localStorage/getCredits";
import { getShips } from "data/localStorage/shipCache";
import { CachedShip } from "data/localStorage/CachedShip";

export const calculateNetWorth = (
  availableShips: AvailableShip[],
  systems: SystemContext
): NetWorthLineItem[] => [
  {
    category: "asset",
    value: getCredits(),
    description: "Credits",
    quantity: getCredits(),
  },
  ...getShips().map((ship) => ({
    value: Math.floor(
      (availableShips.find((av) => av.type === ship.type)?.purchaseLocations[0]
        .price || 0) * 0.25
    ),
    category: "asset" as Category,
    description: ship.type,
    quantity: 1,
  })),
  ...getShips()
    .map((s) => calculateCargoWorth(s, systems))
    .flat(),
];

const calculateCargoWorth = (
  ship: CachedShip,
  systems: SystemContext
): NetWorthLineItem[] => {
  const locationSymbol =
    ship.location?.symbol || ship.flightPlan?.departure || "";
  const systemSymbol = locationSymbol.substr(0, 2);
  const system = systems[systemSymbol];
  if (!system) return [];
  const location = system[locationSymbol];
  if (!location) return [];
  const market = location.marketplace;
  if (!market) return [];
  return ship.cargo.map((c) => ({
    value:
      c.quantity *
      (market.find((m) => m.symbol === c.good)?.sellPricePerUnit || 0),
    category: "asset",
    description: `${ship!.type} ${c.good}`,
    quantity: c.quantity,
  }));
};
