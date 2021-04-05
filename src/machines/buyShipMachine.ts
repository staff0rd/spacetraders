import { assign, createMachine } from "xstate";
import * as api from "../api";
import { AvailableShip } from "../api/AvailableShip";
import db from "../data";
import { IShip } from "../data/IShip";
import { getShipName } from "../data/names";

type Context = {
  token: string;
  username: string;
  availableShips: AvailableShip[];
  response?: api.GetUserResponse;
  shipNames?: IShip[];
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
        src: async (context) => {
          const orderedShips = context.availableShips.sort(
            (a, b) =>
              a.purchaseLocations[0].price - b.purchaseLocations[0].price
          );
          const cheapestShip = orderedShips[0];

          const response = await api.buyShip(
            context.token,
            context.username,
            cheapestShip.purchaseLocations[0].location,
            cheapestShip.type
          );
          await Promise.all(response.user.ships.map((p) => getShipName(p.id)));
          const shipNames = await db.shipNames.toArray();
          return { response, shipNames };
        },
        onError: {
          target: "doneWithError",
        },
        onDone: {
          target: "done",
          actions: assign<Context>({
            response: (c: any, e: any) => e.data.response,
            shipNames: (_, e: any) => e.data.shipNames,
          }) as any,
        },
      },
    },
    doneWithError: {
      type: "final",
    },
    done: {
      type: "final",
      data: {
        response: (context: Context) => context.response,
        shipNames: (context: Context) => context.shipNames,
      },
    },
  },
});
