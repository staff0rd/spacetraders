import { getLocation } from "data/localStorage/locationCache";
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

export async function determineClosestBestTradeRoute(
  shipType: string,
  maxCargo: number,
  locationSymbol?: string
) {
  if (!locationSymbol)
    throw new Error("No location symbol to determine traderoute");
  const location = getLocation(locationSymbol);

  if (!location)
    throw new Error("Couldn't find location from " + locationSymbol);

  const routes = await determineBestTradeRoute(shipType, maxCargo);
  return routes
    .slice(0, 5)
    .map((route) => {
      const departure = getLocation(route.buyLocation);
      return {
        route,
        distance: getDistance(
          location.x,
          location.y,
          departure?.x || Infinity,
          departure?.y || Infinity
        ),
      };
    })
    .sort((a, b) => b.distance - a.distance);
}

export async function determineBestTradeRoute(
  shipType: string,
  maxCargo: number,
  excludeResearch = true,
  excludeLoss = true
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
    .filter((a) => !excludeLoss || a.costVolumeDistance > 0)
    .sort((a, b) => b.costVolumeDistance - a.costVolumeDistance)
    .map((r, ix) => ({
      ...r,
      rank: ix + 1,
    }));
}
