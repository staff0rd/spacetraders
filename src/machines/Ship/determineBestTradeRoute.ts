import { distancePoint } from "components/Locations/Map/geometry";
import { getGraph, getRoute } from "data/localStorage/graph";
import { getLocation } from "data/localStorage/locationCache";
import db from "../../data";
import { getDistance } from "../getDistance";
import { groupByGood } from "./groupByGood";
import { TradeRoute } from "./TradeRoute";

export async function determineBestTradeRouteByCurrentLocation(
  shipType: string,
  maxCargo: number,
  location?: string,
  excludeResearch = true,
  excludeLoss = true
) {
  return (
    await determineBestTradeRoute(
      shipType,
      maxCargo,
      excludeResearch,
      excludeLoss
    )
  ).filter((dest) => dest.buyLocation === location);
}

export async function determineBestTradeRouteByRoute(
  shipType: string,
  maxCargo: number,
  depart?: string,
  destination?: string
) {
  return (
    await determineBestTradeRouteByCurrentLocation(
      shipType,
      maxCargo,
      depart,
      true,
      false
    )
  ).filter((r) => r.sellLocation === destination);
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
  const { graph, warps } = getGraph();

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
              const route = getRoute(
                graph,
                depart.location,
                dest.location,
                shipType,
                maxCargo,
                warps
              );
              const distance = route
                .map((p) => (p.isWarp ? 10 : distancePoint(p.from, p.to)))
                .reduce((a, b) => a + b);
              const fuelNeeded = Math.max(...route.map((a) => a.fuelNeeded));

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
