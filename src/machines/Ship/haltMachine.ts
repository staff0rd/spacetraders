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
import { confirmStrategy } from "./confirmStrategy";

enum States {
  Waiting = "waiting",
  CheckStrategy = "checkStrategy",
  UpdateStrategy = "updateStrategy",
  Done = "done",
  ConfirmStrategy = "confirmStrategy",
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
      shipName: "",
      ship: {} as Ship,
      strategy: { strategy: ShipStrategy.Halt },
    },
    states: {
      [States.Waiting]: {
        after: {
          5000: States.ConfirmStrategy,
        },
      },
      [States.Done]: {
        type: "final",
      },
      [States.ConfirmStrategy]: confirmStrategy(
        ShipStrategy.Halt,
        States.Waiting,
        States.Done
      ),
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
