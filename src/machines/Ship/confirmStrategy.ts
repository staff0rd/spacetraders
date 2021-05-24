import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import { updateStrategy } from "./updateStrategy";
import { ShipOrdersContext } from "./ShipBaseContext";
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
      src: async (c: ShipOrdersContext) => {
        const currentStrategy = (await getStrategy(c.id))!;
        if (getDebug().focusShip === c.id)
          console.warn(
            `${ShipStrategy[currentStrategy.strategy]} === ${
              ShipStrategy[desired]
            }`
          );
        if (currentStrategy.strategy === desired) return { state: nextState };
        await updateStrategy(c.id, desired, currentStrategy);
        return { state: doneState };
      },
      onDone: [
        {
          target: nextState,
          cond: (c: ShipOrdersContext, e: any) => e.data.state === nextState,
          actions: assign<ShipOrdersContext>({
            shouldCheckOrders: false,
          }) as any,
        },
        {
          target: doneState,
          cond: (c: ShipOrdersContext, e: any) => e.data.state === doneState,
        },
      ],
    },
  };
}
