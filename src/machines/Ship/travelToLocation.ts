import { assign } from "xstate";
import { printError } from "./printError";
import { ShipBaseContext } from "./ShipBaseContext";
import { travelToLocationMachine } from "./travelToLocationMachine";

export function travelToLocation<
  TContext extends ShipBaseContext & { goto?: string }
>(destination: (c: TContext) => string, nextState: any, debug: boolean) {
  return {
    invoke: {
      src: (c: TContext) =>
        travelToLocationMachine(debug).withContext({
          id: c.id,
          username: c.username,
          token: c.token,
          destination: destination(c),
        }),
      onError: printError<TContext>(),
      onDone: {
        target: nextState,
        // @ts-ignore
        actions: assign<TContext>({
          shouldCheckOrders: true,
          goto: undefined,
        }) as any,
      },
    },
  };
}
