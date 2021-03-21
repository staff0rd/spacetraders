import { Marketplace } from "../api/Location";
import { getLocation } from "./locationCache";
import { Context, ShouldBuy } from "./shipMachine";

const getProfit = (
  from: Marketplace,
  destination: Marketplace[],
  spaceAvailable: number
) => {
  const hasSpaceFor = Math.floor(spaceAvailable / from.volumePerUnit);
  const sell = destination.find((p) => p.symbol === from.symbol);
  if (!sell) return -from.pricePerUnit;
  return (sell.pricePerUnit - from.pricePerUnit) * hasSpaceFor;
};

export const determineCargo = async (c: Context): Promise<ShouldBuy> => {
  const buyMarket = getLocation(c.ship.location)!.marketplace;
  const sellMarket = getLocation(c.destination!)?.marketplace;
  const nothing = { good: "NONE", quantity: 0 };
  if (!sellMarket) {
    console.warn("No sell market data");
    return nothing;
  }

  const goods = buyMarket
    .filter((buy) => sellMarket.find((sell) => sell.symbol === buy.symbol))
    .map((x) => ({
      good: x.symbol,
      profit: getProfit(x, sellMarket, c.ship.spaceAvailable),
      size: x.volumePerUnit,
    }))
    .filter((x) => x.profit > 0)
    .sort((a, b) => b.profit - a.profit);

  if (!goods.length) {
    console.warn("no profitable goods");
    return nothing;
  }
  console.log("profitable goods", goods);
  const result: ShouldBuy = {
    good: goods[0].good,
    quantity: Math.floor(c.ship.spaceAvailable / goods[0].size),
  };
  return Promise.resolve(result);
};
