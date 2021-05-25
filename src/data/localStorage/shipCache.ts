import db from "data";
import { Ship } from "api/Ship";
import { IShipDetail } from "data/IShipDetail";
import { getResetting } from "./getResetting";
import * as self from "./shipCache";
import * as shipData from "data/ships";
import { IShipOrder, ShipOrders, ShipOrderStatus } from "data/IShipOrder";
import Dexie from "dexie";
import { newShipName } from "data/names";
import { saveNewOrder, completeOrder as saveCompleteOrder } from "data/ships";

export type CachedShip = Ship & {
  name: string;
  orders: IShipOrder[];
};

const local: { ships: CachedShip[] } = {
  ships: [],
};

const addShip = (ship: Ship, name: string, orders: IShipOrder[]) => {
  local.ships.push({ ...ship, name, orders });
};

export const load = async () => {
  if (getResetting()) return;
  try {
    console.info("Refreshing ship cache...");
    local.ships = [];
    const ships = await shipData.getShips();

    for (const s of ships) {
      const detail = await db.shipDetail.get(s.id);
      const orders = await db.shipOrders
        .where("[shipId+status+created]")
        .between(
          [s.id, ShipOrderStatus.Pending, Dexie.minKey],
          [s.id, ShipOrderStatus.Pending, Dexie.maxKey]
        )
        .reverse()
        .toArray();
      if (!detail) throw new Error(`Could not find name for ${s.id}`);
      if (!local.ships.find((p) => p.id === s.id)) {
        addShip(s, detail.name, orders);
      }
    }
  } catch (e) {
    console.log("Error loading:", e);
  }
};

export const saveShips = async (ships: Ship[]) => {
  await shipData.refreshShips(ships);
  await self.load();
};

export const saveShip = async (ship: Ship) => {
  await db.ships.put(ship);
  local.ships = local.ships.map((s) =>
    s.id === ship.id
      ? {
          ...s,
          ...ship,
        }
      : s
  );
};

export const newOrder = async (
  shipId: string,
  order: ShipOrders,
  reason: string,
  payload?: any
) => {
  const saved = await saveNewOrder(shipId, order, reason, payload);
  self.getShip(shipId).orders.push(saved);
};

export const completeOrder = async (shipId: string) => {
  const ship = self.getShip(shipId);
  const lastOrder = ship.orders.shift();
  if (!lastOrder) throw new Error("There are no orders to complete");
  await saveCompleteOrder(lastOrder.id!);
};

export const newShip = async (ship: Ship) => {
  await self.saveShip(ship);
  const newName = newShipName();
  await self.saveDetail({ shipId: ship.id, name: newName });
  const orders = await saveNewOrder(ship.id, ShipOrders.Trade, "New ship");
  addShip(ship, newName, [orders]);
};

export const saveDetail = async (shipDetail: IShipDetail) => {
  await db.shipDetail.put(shipDetail);
  local.ships = local.ships.map((s) =>
    s.id === shipDetail.shipId
      ? {
          ...s,
          name: shipDetail.name,
        }
      : s
  );
};

export const getShips = (): CachedShip[] => local.ships;

export const getShip = (id: string): CachedShip => {
  const result = self.getShips().find((p) => p.id === id);
  if (!result) {
    throw new Error(`Could not find ship ${id}`);
  }
  return result;
};
