import { Ship } from "api/Ship";
import Dexie from "dexie";
import { DateTime } from "luxon";
import db from "./";
import { IShipOrder, ShipOrders, ShipOrderStatus } from "./IShipOrder";

export const refreshShips = async (ships: Ship[]) => {
  await db.ships.clear();
  await db.ships.bulkPut(ships);
};

export const getShips = () => db.ships.toArray();

export const getShipNames = () => db.shipDetail.toArray();

export const saveLastProfit = async (shipId: string, lastProfit: number) => {
  await db.shipDetail.where("shipId").equals(shipId).modify({ lastProfit });
};

export const saveNewOrder = async (
  shipId: string,
  order: ShipOrders,
  reason: string,
  payload?: any
) => {
  const newOrder: IShipOrder = {
    createdAt: DateTime.local().toISO(),
    createdReason: reason,
    order,
    shipId,
    status: ShipOrderStatus.Pending,
    payload,
  };
  const id = await db.shipOrders.put(newOrder);
  newOrder.id = id;
  return newOrder;
};

export const completeOrder = (orderId: number) =>
  db.shipOrders.where("id").equals(orderId).modify({
    completedAt: DateTime.local().toISO(),
    status: ShipOrderStatus.Completed,
  });

export const clearProbes = async (shipId: string) => {
  const probe = await db.probes.where("shipId").equals(shipId).first();
  if (probe) {
    await db.probes.put({ ...probe, shipId: undefined });
  }
};

export const getAllCurrentShipOrders = () =>
  db.shipOrders
    .where("[shipId+status+created]")
    .between(
      [Dexie.minKey, ShipOrderStatus.Pending, Dexie.minKey],
      [Dexie.maxKey, ShipOrderStatus.Pending, Dexie.maxKey]
    )
    .toArray();

export const getRecentShipOrders = (shipId: string) =>
  db.shipOrders
    .where("[shipId+status+created]")
    .between(
      [shipId, Dexie.minKey, Dexie.minKey],
      [shipId, Dexie.maxKey, Dexie.maxKey]
    )
    .reverse()
    .limit(50)
    .toArray();

export const getCurrentShipOrders = (shipId: string) =>
  db.shipOrders
    .where("[shipId+status+created]")
    .between(
      [shipId, ShipOrderStatus.Pending, Dexie.minKey],
      [shipId, ShipOrderStatus.Pending, Dexie.maxKey]
    )
    .toArray();
