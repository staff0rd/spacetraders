import db from "../../data";
import { getFuelNeeded } from "../../data/getFuelNeeded";
import { getDistance } from "../getDistance";
import { groupByGood } from "./groupByGood";
import { ShipBaseContext } from "./ShipBaseContext";
import { TradeRoute } from "./TradeRoute";

export async function determineBestTradeRouteByCurrentLocation(
  c: ShipBaseContext
) {
  return (await determineBestTradeRoute(c)).filter(
    (dest) => dest.buyLocation === c.ship!.location
  );
}

export async function determineBestTradeRoute(
  c: ShipBaseContext
): Promise<TradeRoute[]> {
  const goodLocation = await db.goodLocation.toArray();
  const grouped = groupByGood(goodLocation);

  return grouped
    .map((g) =>
      g.locations
        .map((depart) =>
          g.locations
            .filter((dest) => dest.location !== depart.location)
            .map((dest) => {
              const profitPerUnit =
                depart.purchasePricePerUnit - dest.sellPricePerUnit;
              const volume = depart.volumePerUnit;
              const distance = getDistance(depart.x, depart.y, dest.x, dest.y);
              const fuelNeeded = getFuelNeeded(distance, depart.type);
              const quantityToBuy = Math.floor(
                (c.ship!.maxCargo - fuelNeeded) / volume
              );
              const totalProfit = quantityToBuy * profitPerUnit;
              const result: TradeRoute = {
                buyLocation: depart.location,
                purchasePricePerUnit: depart.purchasePricePerUnit,
                sellLocation: dest.location,
                sellPricePerUnit: dest.sellPricePerUnit,
                distance,
                good: g.good,
                profitPerUnit,
                volume,
                costVolumeDistance: profitPerUnit / volume / distance,
                quantityAvailable: depart.quantityAvailable,
                fuelNeeded,
                quantityToBuy,
                totalProfit,
              };
              return result;
            })
            .flat()
        )
        .flat()
    )
    .flat()
    .sort((a, b) => b.costVolumeDistance - a.costVolumeDistance);
}
