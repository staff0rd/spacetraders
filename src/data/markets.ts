import { Marketplace } from "api/Marketplace";
import { DateTime } from "luxon";
import db from "data";

export const save = (
  symbol: string,
  x: number,
  y: number,
  type: string,
  marketplace: Marketplace[]
) =>
  Promise.all(
    marketplace.map((m) => {
      const market = {
        created: DateTime.now().toISO(),
        location: symbol,
        purchasePricePerUnit: m.purchasePricePerUnit,
        sellPricePerUnit: m.sellPricePerUnit,
        quantityAvailable: m.quantityAvailable,
        volumePerUnit: m.volumePerUnit,
        good: m.symbol,
        x,
        y,
        type,
      };
      db.goodLocation.put(market);
      return db.markets.put(market);
    })
  );
