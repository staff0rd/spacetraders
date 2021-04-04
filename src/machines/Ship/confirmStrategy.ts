import db from "../../data";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import { updateStrategy } from "./updateStrategy";
import { ShipBaseContext } from "./ShipBaseContext";
import { IShipStrategy } from "../../data/Strategy/IShipStrategy";

export function confirmStrategy(
  desired: ShipStrategy,
  nextState: any,
  doneState: any
) {
  return {
    invoke: {
      src: async (c: ShipBaseContext) => {
        const currentStrategy: IShipStrategy = (await db.strategies
          .where({ shipId: c.id })
          .first())!;
        if (currentStrategy.strategy === desired) return nextState;
        console.log("updating strategy");
        await updateStrategy(c.id, desired, currentStrategy);
        return doneState;
      },
      onDone: [
        {
          target: nextState,
          cond: (c: ShipBaseContext, e: any) => e.data === nextState,
        },
        {
          target: doneState,
          cond: (c: ShipBaseContext, e: any) => e.data === doneState,
        },
      ],
    },
  };
}
