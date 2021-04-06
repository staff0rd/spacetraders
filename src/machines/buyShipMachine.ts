import { assign, createMachine } from "xstate";
import * as api from "../api";
import { AvailableShip } from "../api/AvailableShip";
import db from "../data";
import { IShipDetail } from "../data/IShipDetail";
import { getShipName } from "../data/names";

type Context = {
  token: string;
  username: string;
  availableShips: AvailableShip[];
  response?: api.GetUserResponse;
  shipNames?: IShipDetail[];
  shipType: string;
};

export const buyShipMachine = createMachine<Context, any, any>({
  id: "buyShip",
  initial: "buyShip",
  context: {
    token: "",
    username: "",
    availableShips: [],
    response: undefined,
    shipType: "",
  },
  states: {
    buyShip: {
      invoke: {
        src: async (context) => {
          if (!context.shipType) throw new Error("No ship type");
          const location = context.availableShips.find(
            (p) => p.type === context.shipType
          )?.purchaseLocations[0]?.location;
          const response = await api.buyShip(
            context.token,
            context.username,
            location!,
            context.shipType
          );
          await Promise.all(response.user.ships.map((p) => getShipName(p.id)));
          const shipNames = await db.shipDetail.toArray();
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
