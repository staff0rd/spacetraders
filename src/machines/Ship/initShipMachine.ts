import { assign } from "xstate";
import { ShipBaseContext } from "./ShipBaseContext";
import * as api from "../../api";

export function initShipMachine<TContext extends ShipBaseContext>(
  nextState: any
) {
  return {
    invoke: {
      src: async (c: TContext) => {
        const data = await api.getShip(c.token, c.username, c.id);
        return { ship: data.ship };
      },
      onDone: {
        target: nextState,
        actions: assign<TContext>({
          ship: (c, e: any) => e.data.ship,
          shipName: (c, e: any) => e.data.shipName,
        }) as any,
      },
    },
  };
}
