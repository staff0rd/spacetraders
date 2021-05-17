import { Ship } from "api/Ship";
import db from "./";

export const refreshShips = async (ships: Ship[]) => {
  await db.ships.clear();
  await db.ships.bulkPut(ships);
};

export const getShips = () => db.ships.toArray();

export const getShipNames = () => db.shipDetail.toArray();

export const saveLastProfit = async (shipId: string, lastProfit: number) => {
  await db.shipDetail.where("shipId").equals(shipId).modify({ lastProfit });
};
