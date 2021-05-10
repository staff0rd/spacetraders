import db from "data";
import { Ship } from "api/Ship";
import { IShipDetail } from "data/IShipDetail";
import { getResetting } from "./getResetting";

export type CachedShip = Ship & {
  name: string;
};

const local: { ships: CachedShip[] } = {
  ships: [],
};

export const load = async () => {
  if (getResetting()) return;
  try {
    console.info("Refreshing ship cache...");
    local.ships = [];
    const ships = await db.ships.toArray();
    const shipNames = await db.shipDetail.toArray();
    for (const s of ships) {
      const name = shipNames.find((p) => p.shipId === s.id)?.name;
      if (!name) throw new Error(`Could not find name for ${s.id}`);
      addShip(s, name);
    }
  } catch (e) {
    console.log("Error loading:", e);
  }
};

export const saveShips = async (ships: Ship[]) => {
  await db.ships.clear();
  await db.ships.bulkPut(ships);

  await load();
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

export const addShip = (ship: Ship, name: string) => {
  local.ships.push({ ...ship, name });
};

export const getShips = (): CachedShip[] => local.ships;

export const getShip = (id: string): CachedShip => {
  const result = local.ships.find((p) => p.id === id);
  if (!result) {
    throw new Error(`Could not find ship ${id}`);
  }
  return result;
};
