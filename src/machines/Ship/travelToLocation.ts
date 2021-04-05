import { assign } from "xstate";
import { printError } from "./printError";
import { ShipBaseContext } from "./ShipBaseContext";
import { travelToLocationMachine } from "./travelToLocationMachine";

export function travelToLocation<TContext extends ShipBaseContext>(
  destination: (c: TContext) => string,
  nextState: any
) {
  return {
    invoke: {
      src: (c: TContext) =>
        travelToLocationMachine.withContext({
          id: c.id,
          username: c.username,
          token: c.token,
          destination: destination(c),
          ship: c.ship!,
          shipName: c.shipName,
        }),
      onError: printError<TContext>(),
      onDone: {
        target: nextState,
        // @ts-ignore
        actions: assign<TContext>({
          ship: (c, e: any) => e.data.ship,
          flightPlan: undefined,
          location: undefined,
          shouldCheckStrategy: true,
        }) as any,
      },
    },
    on: {
      FLIGHTPLAN_UPDATE: {
        actions: assign<TContext>({ flightPlan: (c, e: any) => e.data }),
      },
    },
  };
}
