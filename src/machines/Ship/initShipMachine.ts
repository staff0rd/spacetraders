import { assign } from "xstate";
import { ShipBaseContext } from "./ShipBaseContext";
import * as api from "../../api";
import { getShip } from "data/localStorage/shipCache";

export function initShipMachine<TContext extends ShipBaseContext>(
  nextState: any
) {
  return {
    invoke: {
      src: async (c: TContext) => {
        const ship = getShip(c.id);
        if (ship.flightPlanId) {
          const flightPlan = await api.getFlightPlan(
            c.token,
            c.username,
            ship.flightPlanId
          );
          return { ship, flightPlan: flightPlan.flightPlan };
        }
        return { ship };
      },
      onDone: {
        target: nextState,
        actions: assign<TContext>({
          ship: (c, e: any) => e.data.ship,
          flightPlan: (c, e: any) => e.data.flightPlan,
        }) as any,
      },
    },
  };
}
