import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import db from "../../data";
import { ChangePayload } from "../../data/Strategy/StrategyPayloads";

export const persistStrategy = async (
  shipId: string,
  newStrategy: ShipStrategy,
  oldStrategy: ShipStrategy
) => {
  db.strategies.put({
    shipId,
    strategy: ShipStrategy.Change,
    data: {
      from: {
        strategy: oldStrategy,
      },
      to: { strategy: newStrategy },
    } as ChangePayload,
  });

  if (oldStrategy === ShipStrategy.Probe) {
    const probe = await db.probes.where("shipId").equals(shipId).first();
    if (probe) {
      db.probes.put({ ...probe, shipId: undefined });
    }
  }
};
