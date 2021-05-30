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
import { travelToLocation } from "./travelToLocation";
import { newOrder } from "data/localStorage/shipCache";
import { ShipOrders } from "data/IShipOrder";

enum States {
  Idle = "idle",
  ConfirmStrategy = "confirmStrategy",
  Done = "done",
  TravelToLocation = "travelToLocation",
  SwitchToHalt = "switchToHalt",
}

export type Context = ShipBaseContext & {
  destination: string;
};

export type Actor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

const config: MachineConfig<Context, any, any> = {
  id: "goto",
  initial: States.ConfirmStrategy,
  states: {
    [States.Idle]: {
      after: {
        1: [
          {
            //cond: (c) => !!getShip(c.id).flightPlan,
            target: States.TravelToLocation,
          },
        ],
      },
    },

    [States.Done]: {
      type: "final",
    },
    [States.ConfirmStrategy]: confirmStrategy(States.Idle, States.Done),
    [States.TravelToLocation]: {
      ...travelToLocation<Context>(
        (c) => c.destination,
        States.SwitchToHalt,
        false
      ),
    },
    [States.SwitchToHalt]: {
      invoke: {
        src: async (c) => {
          await newOrder(c.id, ShipOrders.Halt, `Arrived at ${c.destination}`);
        },
        onDone: { target: States.Done },
      },
    },
  },
};

export const gotoMachine = createMachine(debugShipMachineStates(config));
