import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import db from "../../data";
import { ChangeStrategyPayload } from "../../data/Strategy/StrategyPayloads";

export const persistStrategy = async (
  shipId: string,
  oldStrategy: ShipStrategy,
  newStrategy: ShipStrategy
) => {
  await db.strategies.put({
    shipId,
    strategy: ShipStrategy.Change,
    data: {
      from: {
        strategy: oldStrategy,
      },
      to: { strategy: newStrategy },
    } as ChangeStrategyPayload,
  });

  if (oldStrategy === ShipStrategy.Probe) {
    const probe = await db.probes.where("shipId").equals(shipId).first();
    if (probe) {
      await db.probes.put({ ...probe, shipId: undefined });
    }
  }
};
