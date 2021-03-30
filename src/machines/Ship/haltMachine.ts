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
import { updateStrategy } from "./updateStrategy";
import { ShipBaseContext } from "./ShipBaseContext";

enum States {
  Waiting = "waiting",
  CheckStrategy = "checkStrategy",
  UpdateStrategy = "updateStrategy",
  Done = "done",
}

export type Context = ShipBaseContext;

export type Actor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

export const haltMachine = createMachine<Context, any, any>(
  {
    id: "halt",
    initial: States.Waiting,
    context: {
      id: "",
      token: "",
      username: "",
      ship: {} as Ship,
      strategy: { strategy: ShipStrategy.Halt },
    },
    states: {
      [States.Waiting]: {
        after: {
          1000: [
            {
              target: States.UpdateStrategy,
              cond: "shouldDone",
            },
            { target: States.CheckStrategy },
          ],
        },
      },
      [States.Done]: {
        type: "final",
      },
      [States.UpdateStrategy]: {
        invoke: {
          src: updateStrategy,
          onDone: {
            target: States.Done,
          },
        },
      },
      [States.CheckStrategy]: {
        invoke: {
          src: "checkStrategy",
          onDone: {
            target: States.Waiting,
            actions: "checkStrategy",
          },
        },
      },
    },
  },
  {
    services: {
      checkStrategy: async (c) => {
        const strategy = await db.strategies.where({ shipId: c.id }).first();
        return strategy;
      },
    },
    actions: {
      checkStrategy: assign<Context>({
        strategy: (c, e: any) => e.data,
      }),
    },
    guards: {
      shouldDone: (c) => c.strategy.strategy !== ShipStrategy.Halt,
    },
  }
);
