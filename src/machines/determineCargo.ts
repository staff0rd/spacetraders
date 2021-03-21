import { Marketplace } from "../api/Location";
import { MarketContext } from "./MarketContext";
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
  const market: MarketContext = JSON.parse(localStorage.getItem("locations")!);
  const buyMarket = market[c.ship.location].marketplace;
  const sellMarket = market[c.destination!].marketplace;
  const nothing = { good: "NONE", quantity: 0 };
  if (!sellMarket) return nothing;

  const goods = buyMarket
    .filter((buy) => sellMarket.find((sell) => sell.symbol === buy.symbol))
    .map((x) => ({
      good: x.symbol,
      profit: getProfit(x, sellMarket, c.ship.spaceAvailable),
      size: x.volumePerUnit,
    }))
    .sort((a, b) => b.profit - a.profit);
  console.log(goods);
  if (!goods.length || goods[0].profit === 0) return nothing;

  const result: ShouldBuy = {
    good: goods[0].good,
    quantity: Math.floor(c.ship.spaceAvailable / goods[0].size),
  };
  return Promise.resolve(result);
};
