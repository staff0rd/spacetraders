import {
  ActorRefFrom,
  createMachine,
  EventObject,
  MachineOptions,
  StateMachine,
  MachineConfig,
} from "xstate";
import { Ship } from "../../api/Ship";
import db from "../../data";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import { ShipBaseContext } from "./ShipBaseContext";
import { confirmStrategy } from "./confirmStrategy";
import { debugShipMachineStates } from "machines/debugStates";

enum States {
  Waiting = "waiting",
  CheckStrategy = "checkStrategy",
  UpdateStrategy = "updateStrategy",
  Done = "done",
  ConfirmStrategy = "confirmStrategy",
}

export type Context = ShipBaseContext;

export type Actor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

const config: MachineConfig<Context, any, any> = {
  id: "halt",
  initial: States.Waiting,
  context: {
    id: "",
    token: "",
    username: "",
    ship: {} as Ship,
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
};
const options: Partial<MachineOptions<Context, any>> = {
  services: {
    checkStrategy: async (c) => {
      const strategy = await db.strategies.where({ shipId: c.id }).first();
      return strategy;
    },
  },
};

export const haltMachine = createMachine(
  debugShipMachineStates(config),
  options
);
