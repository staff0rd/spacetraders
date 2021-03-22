import { MarketContext } from "./MarketContext";
import { Ship } from "../api/Ship";
import { AvailableShip } from "../api/AvailableShip";
import { FlightPlan } from "../api/FlightPlan";

type Category = "asset" | "debt";
export type LineItem = {
  category: Category;
  value: number;
  description: string;
};

export const calculateNetWorth = (
  credits: number,
  ships: Ship[],
  availableShips: AvailableShip[],
  markets: MarketContext,
  flightPlans: FlightPlan[]
): LineItem[] => [
  { category: "asset", value: credits, description: "Credits" },
  ...ships.map((ship) => ({
    value:
      (availableShips.find((av) => av.type === ship.type)?.purchaseLocations[0]
        .price || 0) * 0.25,
    category: "asset" as Category,
    description: ship.type,
  })),
  ...ships.map((s) => calculateCargoWorth(s, markets, flightPlans)).flat(),
];

const calculateCargoWorth = (
  ship: Ship,
  markets: MarketContext,
  flightPlans: FlightPlan[]
): LineItem[] => {
  const market =
    markets[
      ship.location ||
        flightPlans.find((fp) => fp.shipId === ship.id)?.from ||
        ""
    ]?.marketplace;
  if (!market) return [];
  return ship.cargo.map((c) => ({
    value:
      c.quantity * (market.find((m) => m.symbol === c.good)?.pricePerUnit || 0),
    category: "asset",
    description: `${ship.type} ${c.good}`,
  }));
};
