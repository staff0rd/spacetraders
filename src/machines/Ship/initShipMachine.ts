import { assign } from "xstate";
import { ShipBaseContext } from "./ShipBaseContext";
import * as api from "../../api";

export function initShipMachine<TContext extends ShipBaseContext>(
  nextState: any
) {
  return {
    invoke: {
      src: async (c: TContext) => {
        const ship = await api.getShip(c.token, c.username, c.id);
        if (ship.ship.flightPlanId) {
          const flightPlan = await api.getFlightPlan(
            c.token,
            c.username,
            ship.ship.flightPlanId
          );
          return { ship: ship.ship, flightPlan: flightPlan.flightPlan };
        }
        return { ship: ship.ship };
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
