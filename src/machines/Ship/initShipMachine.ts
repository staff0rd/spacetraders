import { assign } from "xstate";
import { ShipBaseContext } from "./ShipBaseContext";
import * as api from "../../api";
import { getShipName } from "../../data/names";
import { debugShipMachine } from "./debug";

export function initShipMachine<TContext extends ShipBaseContext>(
  machineName: string,
  nextState: any
) {
  return {
    entry: debugShipMachine<TContext>(machineName),
    invoke: {
      src: async (c: TContext) => {
        const data = await api.getShip(c.token, c.username, c.id);
        return { ship: data.ship, shipName: await getShipName(c.id) };
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
