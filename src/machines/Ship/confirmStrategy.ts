import { ShipOrdersContext } from "./ShipBaseContext";
import { assign } from "xstate";
import { getShip, completeOrder } from "data/localStorage/shipCache";

export function confirmStrategy(
  nextState: any,
  doneState: any,
  onDone?: (c: ShipOrdersContext) => Promise<any>
) {
  return {
    invoke: {
      src: async (c: ShipOrdersContext) => {
        const ship = getShip(c.id);
        const orderCount = ship.orders.length;

        if (orderCount === 1) return { state: nextState };

        await completeOrder(c.id);

        onDone && (await onDone(c));

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
      onError: {
        actions: (c: any, e: any) => console.log(e.data),
      },
    },
  };
}
