import { distancePoint } from "components/Locations/Map/geometry";
import { getDebug } from "data/localStorage/getDebug";
import { getGraph, getRoute } from "data/localStorage/graph";
import { fuelCache, getLocation } from "data/localStorage/locationCache";
import db from "../../data";
import { getDistance } from "../getDistance";
import { groupByGood } from "./groupByGood";
import { ITradeShip } from "./ITradeShip";
import { TradeRoute } from "./TradeRoute";

export async function determineBestTradeRouteByCurrentLocation(
  ship: ITradeShip,
  location?: string,
  excludeResearch = true,
  excludeLoss = true
) {
  return (
    await determineBestTradeRoute(ship, excludeResearch, excludeLoss)
  ).filter((dest) => dest.buyLocation === location);
}

export async function determineBestTradeRouteByRoute(
  ship: ITradeShip,
  depart?: string,
  destination?: string
) {
  return (
    await determineBestTradeRouteByCurrentLocation(ship, depart, true, false)
  ).filter((r) => r.sellLocation === destination);
}

export async function determineClosestBestTradeRoute(
  ship: ITradeShip,
  locationSymbol?: string
) {
  if (!locationSymbol)
    throw new Error("No location symbol to determine traderoute");
  const location = getLocation(locationSymbol);

  if (!location)
    throw new Error("Couldn't find location from " + locationSymbol);

  const routes = await determineBestTradeRoute(ship);
  const mapped = routes.slice(0, 5).map((route) => {
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
  });
  const sorted = [...mapped].sort((a, b) => a.distance - b.distance);
  return sorted;
}

export async function determineBestTradeRoute(
  ship: ITradeShip,
  excludeResearch = true,
  excludeLoss = true
): Promise<TradeRoute[]> {
  const goodLocation = await db.goodLocation.toArray();
  const grouped = groupByGood(goodLocation);
  const { graph, warps } = getGraph();
  const { focusTradeRoute } = getDebug();

  return grouped
    .map((g) =>
      g.locations
        .map((depart) =>
          g.locations
            .filter((dest) => dest.location !== depart.location)
            .filter((x) => !excludeResearch || x.good !== "RESEARCH")
            .map((dest) => {
              const volume = depart.volumePerUnit;
              const route = getRoute(
                graph,
                depart.location,
                dest.location,
                ship,
                warps
              );
              const distance = route
                .map((p) => (p.isWarp ? 10 : distancePoint(p.from, p.to)))
                .reduce((a, b) => a + b);

              const fuelNeeded = Math.max(...route.map((a) => a.fuelNeeded));

              const quantityToBuy = Math.floor(
                (ship.maxCargo - fuelNeeded) / volume
              );
              const fuelCost =
                ((fuelCache[depart.location]?.available ?? 0) > 500
                  ? fuelCache[depart.location]?.cost ?? 9999
                  : 9999) * fuelNeeded;

              const profitPerUnit =
                dest.sellPricePerUnit -
                depart.purchasePricePerUnit -
                fuelCost / quantityToBuy;

              const flightTime = Math.round(distance * (2 / ship.speed)) + 60;

              const costVolumeDistance = profitPerUnit / volume / flightTime;
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
                fuelCost: fuelCost / quantityToBuy,
                costVolumeDistance,
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
    .filter(
      (a) =>
        !focusTradeRoute ||
        (focusTradeRoute.from === a.buyLocation &&
          focusTradeRoute.to === a.sellLocation &&
          focusTradeRoute.good === a.good)
    )
    .sort((a, b) => b.costVolumeDistance - a.costVolumeDistance)
    .map((r, ix) => ({
      ...r,
      rank: ix + 1,
    }));
}
