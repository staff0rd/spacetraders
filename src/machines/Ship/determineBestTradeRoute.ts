import db from "../../data";
import { getFuelNeeded } from "../../data/getFuelNeeded";
import { getDistance } from "../getDistance";
import { groupByGood } from "./groupByGood";
import { TradeRoute } from "./TradeRoute";

export async function determineBestTradeRouteByCurrentLocation(
  shipType: string,
  maxCargo: number,
  location?: string
) {
  return (await determineBestTradeRoute(shipType, maxCargo)).filter(
    (dest) => dest.buyLocation === location
  );
}

export async function determineBestTradeRoute(
  shipType: string,
  maxCargo: number,
  excludeResearch = true
): Promise<TradeRoute[]> {
  const goodLocation = await db.goodLocation.toArray();
  const grouped = groupByGood(goodLocation);

  return grouped
    .map((g) =>
      g.locations
        .map((depart) =>
          g.locations
            .filter((dest) => dest.location !== depart.location)
            .filter((x) => !excludeResearch || x.good !== "RESEARCH")
            .map((dest) => {
              const profitPerUnit =
                dest.sellPricePerUnit - depart.purchasePricePerUnit;
              const volume = depart.volumePerUnit;
              const distance = getDistance(depart.x, depart.y, dest.x, dest.y);
              const fuelNeeded = getFuelNeeded(distance, depart.type, shipType);
              const quantityToBuy = Math.floor(
                (maxCargo - fuelNeeded) / volume
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
    .filter((a) => a.costVolumeDistance > 0)
    .sort((a, b) => b.costVolumeDistance - a.costVolumeDistance);
}
