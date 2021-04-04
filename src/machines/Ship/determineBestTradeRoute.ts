import db from "../../data";
import { getFuelNeeded } from "../../data/getFuelNeeded";
import { IMarketNow } from "../../data/IMarket";
import { getDistance } from "../getDistance";
import { ShipBaseContext } from "./ShipBaseContext";

type TradeRoute = {
  good: string;
  buyLocation: string;
  sellLocation: string;
  distance: number;
  volume: number;
  profitPerUnit: number;
  totalProfit: number;
  costVolumeDistance: number;
  quantityAvailable: number;
  quantityToBuy: number;
  fuelNeeded: number;
};

type GroupByGood = {
  [key: string]: { locations: IMarketNow[]; good: string };
};

function groupByGood(market: IMarketNow[] | undefined) {
  const grouped: GroupByGood = {};
  market?.reduce(function (res: GroupByGood, value: IMarketNow) {
    if (!res[value.good]) {
      res[value.good] = {
        good: value.good,
        locations: [],
      };
      grouped[value.good] = res[value.good];
    }
    res[value.good].locations.push(value);
    return res;
  }, {});
  return Object.values(grouped);
}

export async function determineBestTradeRoute(
  c: ShipBaseContext
): Promise<any> {
  const goodLocation = await db.goodLocation.toArray();
  const grouped = groupByGood(goodLocation);

  grouped
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
              const quantityToBuy = c.ship!.maxCargo - fuelNeeded;
              const totalProfit = quantityToBuy * profitPerUnit;
              const result: TradeRoute = {
                buyLocation: depart.location,
                sellLocation: dest.location,
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
    .sort((a, b) => b.costVolumeDistance - a.costVolumeDistance)
    .slice(0, 10)
    .forEach((x) => console.log(x));
}
