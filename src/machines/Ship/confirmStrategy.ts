import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import { updateStrategy } from "./updateStrategy";
import { ShipStrategyContext } from "./ShipBaseContext";
import { assign } from "xstate";
import { getDebug } from "data/localStorage/getDebug";
import { getStrategy } from "data/strategies";

export function confirmStrategy(
  desired: ShipStrategy,
  nextState: any,
  doneState: any
) {
  return {
    invoke: {
      src: async (c: ShipStrategyContext) => {
        const currentStrategy = (await getStrategy(c.id))!;
        if (getDebug().focusShip === c.id)
          console.warn(
            `${ShipStrategy[currentStrategy.strategy]} === ${
              ShipStrategy[desired]
            }`
          );
        if (currentStrategy.strategy === desired)
          return { state: nextState, data: currentStrategy.data };
        console.log("updating strategy");
        await updateStrategy(c.id, desired, currentStrategy);
        return { state: doneState };
      },
      onDone: [
        {
          target: nextState,
          cond: (c: ShipStrategyContext, e: any) => e.data.state === nextState,
          actions: assign<ShipStrategyContext>({
            shouldCheckStrategy: false,
            strategy: (c: ShipStrategyContext, e: any) => ({
              ...c.strategy,
              data: e.data.data,
            }),
          }) as any,
        },
        {
          target: doneState,
          cond: (c: ShipStrategyContext, e: any) => e.data.state === doneState,
        },
      ],
    },
  };
}
