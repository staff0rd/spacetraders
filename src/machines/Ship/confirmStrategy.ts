import db from "../../data";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import { updateStrategy } from "./updateStrategy";
import { ShipStrategyContext } from "./ShipBaseContext";
import { IShipStrategy } from "../../data/Strategy/IShipStrategy";
import { assign } from "xstate";

export function confirmStrategy(
  desired: ShipStrategy,
  nextState: any,
  doneState: any
) {
  return {
    invoke: {
      src: async (c: ShipStrategyContext) => {
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
          cond: (c: ShipStrategyContext, e: any) => e.data === nextState,
          actions: assign<ShipStrategyContext>({
            shouldCheckStrategy: false,
          }),
        },
        {
          target: doneState,
          cond: (c: ShipStrategyContext, e: any) => e.data === doneState,
        },
      ],
    },
  };
}
