import { ShipStrategy } from "./Strategy/ShipStrategy";
import db from ".";
import { ChangeStrategyPayload } from "./Strategy/StrategyPayloads";

export const persistStrategy = async (
  shipId: string,
  oldStrategy: ShipStrategy,
  newStrategy: ShipStrategy,
  graceful = true,
  data?: any
) => {
  if (graceful && oldStrategy !== ShipStrategy.Change)
    await db.strategies.put({
      shipId,
      strategy: ShipStrategy.Change,
      data: {
        from: {
          strategy: oldStrategy,
        },
        to: { strategy: newStrategy, data },
      } as ChangeStrategyPayload,
    });
  else
    await db.strategies.put({
      shipId,
      strategy: newStrategy,
      data,
    });

  if (oldStrategy === ShipStrategy.Probe) {
    const probe = await db.probes.where("shipId").equals(shipId).first();
    if (probe) {
      await db.probes.put({ ...probe, shipId: undefined });
    }
  }
};
