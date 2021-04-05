import { SystemContext } from "./MarketContext";
import { AvailableShip } from "../api/AvailableShip";
import { Context as ShipContext } from "./Ship/tradeMachine";
import { NetWorthLineItem, Category } from "./NetWorthLineItem";

export const calculateNetWorth = (
  credits: number,
  scs: ShipContext[],
  availableShips: AvailableShip[],
  systems: SystemContext
): NetWorthLineItem[] => [
  {
    category: "asset",
    value: credits,
    description: "Credits",
    quantity: credits,
  },
  ...scs
    .filter((sc) => !!sc.ship)
    .map((sc) => ({
      value: Math.floor(
        (availableShips.find((av) => av.type === sc.ship!.type)
          ?.purchaseLocations[0].price || 0) * 0.25
      ),
      category: "asset" as Category,
      description: sc.ship!.type,
      quantity: 1,
    })),
  ...scs.map((s) => calculateCargoWorth(s, systems)).flat(),
];

const calculateCargoWorth = (
  sc: ShipContext,
  systems: SystemContext
): NetWorthLineItem[] => {
  if (!sc.ship) return [];
  const locationSymbol = sc.ship.location || sc.flightPlan?.departure || "";
  const systemSymbol = locationSymbol.substr(0, 2);
  const system = systems[systemSymbol];
  if (!system) return [];
  const location = system[locationSymbol];
  if (!location) return [];
  const market = location.marketplace;
  if (!market) return [];
  return sc.ship.cargo.map((c) => ({
    value:
      c.quantity *
      (market.find((m) => m.symbol === c.good)?.sellPricePerUnit || 0),
    category: "asset",
    description: `${sc.ship!.type} ${c.good}`,
    quantity: c.quantity,
  }));
};
