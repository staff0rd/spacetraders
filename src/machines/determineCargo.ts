import { Marketplace } from "../api/Marketplace";
import { getLocation } from "./locationCache";
import { Context, ShouldBuy } from "./Ship/tradeMachine";

type BestBuy = {
  profit: number;
  quantity: number;
};
const getProfit = (
  from: Marketplace,
  destination: Marketplace[],
  spaceAvailable: number,
  credits: number
): BestBuy => {
  const hasSpaceFor = Math.floor(spaceAvailable / from.volumePerUnit);
  const hasCreditsFor = Math.floor(credits / from.pricePerUnit);
  const quantity = Math.min(
    hasSpaceFor,
    hasCreditsFor,
    from.quantityAvailable,
    1000
  );
  const sell = destination.find((p) => p.symbol === from.symbol);
  if (!sell) return { profit: -from.pricePerUnit, quantity };
  return {
    profit: (sell.pricePerUnit - from.pricePerUnit) * quantity,
    quantity,
  };
};

export const determineCargo = async (c: Context): Promise<ShouldBuy> => {
  const buyMarket = getLocation(c.ship.location!)!.marketplace;
  const sellMarket = getLocation(c.destination!)?.marketplace;
  const nothing: ShouldBuy = {
    good: "NONE",
    quantity: 0,
    profit: 0,
    sellTo: c.destination,
  };
  if (!sellMarket) {
    console.warn("No sell market data");
    return nothing;
  }

  const goods = buyMarket
    .filter((buy) => sellMarket.find((sell) => sell.symbol === buy.symbol))
    .map((x) => ({
      good: x.symbol,
      ...getProfit(x, sellMarket, c.ship.spaceAvailable, c.credits),
    }))
    .filter((x) => x.profit > 0)
    .sort((a, b) => b.profit - a.profit);

  if (!goods.length) {
    return nothing;
  }

  const result: ShouldBuy = {
    good: goods[0].good,
    quantity: goods[0].quantity,
    sellTo: c.destination,
    profit: goods[0].profit,
  };

  return Promise.resolve(result);
};
