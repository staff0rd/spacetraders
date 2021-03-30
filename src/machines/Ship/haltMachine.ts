import {
  ActorRefFrom,
  assign,
  createMachine,
  EventObject,
  StateMachine,
} from "xstate";
import { Ship } from "../../api/Ship";
import db from "../../data";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import { ShipBaseContext } from "./ShipBaseContext";

enum States {
  Waiting = "waiting",
  CheckStrategy = "checkStrategy",
  Done = "done",
}

export type Context = ShipBaseContext;

export type Actor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

export const haltMachine = createMachine<Context, any, any>(
  {
    id: "halt",
    initial: States.Waiting,
    context: {
      token: "",
      username: "",
      ship: {} as Ship,
      strategy: ShipStrategy.Halt,
    },
    states: {
      [States.Waiting]: {
        after: {
          1000: [
            { target: States.Done, cond: "shouldDone" },
            { target: States.CheckStrategy, cond: "shouldCheckStrategy" },
          ],
        },
      },
      [States.Done]: {
        type: "final",
      },
      [States.CheckStrategy]: {
        invoke: {
          src: "checkStrategy",
          onDone: {
            target: "idle",
            actions: "checkStrategy",
          },
        },
      },
    },
  },
  {
    services: {
      checkStrategy: async (c) => {
        const strategy = await db.strategies
          .where({ shipId: c.ship.id })
          .first();
        return strategy?.strategy;
      },
    },
    actions: {
      checkStrategy: assign<Context>({
        strategy: (c, e: any) => e.data,
      }),
    },
    guards: {
      shouldDone: (c) => c.strategy !== ShipStrategy.Halt,
    },
  }
);
