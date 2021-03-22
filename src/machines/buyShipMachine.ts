import { assign, createMachine } from "xstate";
import * as api from "../api";
import { AvailableShip } from "../api/AvailableShip";

type Context = {
  token: string;
  username: string;
  availableShips: AvailableShip[];
  response?: api.GetUserResponse;
};

export const buyShipMachine = createMachine<Context, any, any>({
  id: "buyShip",
  initial: "buyShip",
  context: {
    token: "",
    username: "",
    availableShips: [],
    response: undefined,
  },
  states: {
    buyShip: {
      invoke: {
        src: (context) => {
          const orderedShips = context.availableShips.sort(
            (a, b) =>
              a.purchaseLocations[0].price - b.purchaseLocations[0].price
          );
          const cheapestShip = orderedShips[0];

          return api.buyShip(
            context.token,
            context.username,
            cheapestShip.purchaseLocations[0].location,
            cheapestShip.type
          );
        },
        onDone: {
          target: "done",
          actions: assign<Context>({
            response: (c: any, e: any) => e.data,
          }) as any,
        },
      },
    },
    done: {
      type: "final",
      data: {
        response: (context: Context) => context.response,
      },
    },
  },
});
