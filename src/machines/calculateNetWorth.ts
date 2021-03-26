import { MarketContext } from "./MarketContext";
import { AvailableShip } from "../api/AvailableShip";
import { Context as ShipContext } from "./shipMachine";
import { NetWorthLineItem, Category } from "./NetWorthLineItem";

export const calculateNetWorth = (
  credits: number,
  scs: ShipContext[],
  availableShips: AvailableShip[],
  markets: MarketContext
): NetWorthLineItem[] => [
  { category: "asset", value: credits, description: "Credits" },
  ...scs.map((sc) => ({
    value:
      (availableShips.find((av) => av.type === sc.ship.type)
        ?.purchaseLocations[0].price || 0) * 0.25,
    category: "asset" as Category,
    description: sc.ship.type,
  })),
  ...scs.map((s) => calculateCargoWorth(s, markets)).flat(),
];

const calculateCargoWorth = (
  sc: ShipContext,
  markets: MarketContext
): NetWorthLineItem[] => {
  const market =
    markets[sc.ship.location || sc.flightPlan?.from || ""]?.marketplace;
  if (!market) return [];
  return sc.ship.cargo.map((c) => ({
    value:
      c.quantity * (market.find((m) => m.symbol === c.good)?.pricePerUnit || 0),
    category: "asset",
    description: `${sc.ship.type} ${c.good}`,
  }));
};
