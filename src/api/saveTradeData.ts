import db from "../data/";
import { DateTime } from "luxon";
import { TradeType } from "../data/ITrade";
import Dexie from "dexie";
import { MarketOrder } from "./index";
import { TradeRoute } from "machines/Ship/TradeRoute";

export async function saveTradeData(
  shipId: string,
  order: MarketOrder,
  location: string,
  type: TradeType
) {
  const tradeData = await getLastIncomplete(shipId);

  if (tradeData) {
    const now = DateTime.now();
    tradeData.updated = now.toISO();
    tradeData.trades.push({
      cost: type === TradeType.Buy ? -order.total : order.total,
      good: order.good,
      location,
      quantity: order.quantity,
      timestamp: now.toISO(),
      type,
    });

    if (
      tradeData.trades
        .filter((p) => p.type === TradeType.Sell)
        .map((p) => p.quantity)
        .reduce((a, b) => a + b, 0) === tradeData.tradeRoute.quantityToBuy
    ) {
      tradeData.complete = 1;
    }

    tradeData.timeTaken = now.diff(
      DateTime.fromISO(tradeData.created),
      "seconds"
    ).seconds;
    tradeData.profit = tradeData.trades
      .map((t) => t.cost)
      .reduce((a, b) => a + b);
    await db.tradeData.put(tradeData);
  }
}

async function getLastIncomplete(shipId: string) {
  return db.tradeData
    .where("[shipId+created+complete]")
    .between([shipId, Dexie.minKey, 0], [shipId, Dexie.maxKey, 0])
    .reverse()
    .first();
}

export async function newTradeRoute(tradeRoute: TradeRoute, shipId: string) {
  const now = DateTime.now().toISO();
  await db.tradeRoutes.put({
    ...tradeRoute,
    created: now,
    shipId,
  });
  await markLastComplete(shipId);
  await db.tradeData.put({
    created: now,
    profit: 0,
    shipId,
    timeTaken: 0,
    tradeRoute,
    trades: [],
    updated: now,
    complete: 0,
  });
}

export async function markLastComplete(shipId: string) {
  const results = await db.tradeData
    .where("[shipId+created+complete]")
    .between([shipId, Dexie.minKey, 0], [shipId, Dexie.maxKey, 0])
    .toArray();

  for (const result of results) {
    if (result.complete === 0) {
      if (!result.trades.length) await db.tradeData.delete(result.id!);
      else {
        await db.tradeData
          .where("id")
          .equals(result.id!)
          .modify({ complete: 1 });
      }
    }
  }
}
