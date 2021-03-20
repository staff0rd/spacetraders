import { assign, createMachine, sendParent } from "xstate";
import * as api from "../api";
import { Ship } from "../api/Ship";

type Context = {
  token: string;
  username: string;
  ship: Ship;
};

const fuelAmountNeeded = (s: Ship) =>
  10 - (s.cargo.find((c) => c.good === "FUEL")?.quantity || 0);

export const shipMachine = createMachine<Context, any, any>(
  {
    id: "buyShip",
    initial: "idle",
    context: {
      token: "",
      username: "",
      ship: {} as Ship,
    },
    states: {
      idle: {
        entry: (c) => console.log("ship: idle", c),
        always: [{ target: "buyFuel", cond: "needFuel" }],
      },
      buyFuel: {
        entry: (c) => console.log("ship: buyFuel", c),
        invoke: {
          src: (context: Context) => {
            const fuelToBuy = fuelAmountNeeded(context.ship);
            return api.purchaseOrder(
              context.token,
              context.username,
              context.ship.id,
              "FUEL",
              fuelToBuy
            );
          },
          onDone: {
            target: "idle",
            actions: [
              assign({ ship: (c, e) => e.data.ship }),
              sendParent((context, event) => ({
                type: "UPDATE_CREDITS",
                data: event.data.credits,
              })),
            ],
          },
        },
      },
    },
  },
  {
    guards: {
      needFuel: (c) => fuelAmountNeeded(c.ship) > 0,
    },
  }
);
