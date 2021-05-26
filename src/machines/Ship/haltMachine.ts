import {
  ActorRefFrom,
  createMachine,
  EventObject,
  StateMachine,
  MachineConfig,
} from "xstate";
import { ShipBaseContext } from "./ShipBaseContext";
import { confirmStrategy } from "./confirmStrategy";
import { debugShipMachineStates } from "machines/debugStates";

enum States {
  Waiting = "waiting",
  UpdateStrategy = "updateStrategy",
  Done = "done",
  ConfirmStrategy = "confirmStrategy",
}

export type Context = ShipBaseContext;

export type Actor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

const config: MachineConfig<Context, any, any> = {
  id: "halt",
  initial: States.Waiting,
  states: {
    [States.Waiting]: {
      after: {
        5000: States.ConfirmStrategy,
      },
    },
    [States.Done]: {
      type: "final",
    },
    [States.ConfirmStrategy]: confirmStrategy(States.Waiting, States.Done),
  },
};

export const haltMachine = createMachine(debugShipMachineStates(config));
