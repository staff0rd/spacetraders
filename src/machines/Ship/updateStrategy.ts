import db from "../../data";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import { ShipBaseContext } from "./ShipBaseContext";

export const updateStrategy = async (c: ShipBaseContext) => {
  if (c.strategy.strategy === ShipStrategy.Change) {
    await db.strategies.put({
      shipId: c.id,
      strategy: c.strategy.data!.to.strategy,
      data: c.strategy.data!.to.data,
    });
  }
};
