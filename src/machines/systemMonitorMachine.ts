import { getDebug } from "data/localStorage/getDebug";
import {
  ActorRefFrom,
  createMachine,
  MachineConfig,
  StateMachine,
} from "xstate";
import { debugMachineStates } from "./debugStates";
import { getShips } from "data/localStorage/shipCache";
import * as api from "api";

export type SystemMonitorActor = ActorRefFrom<StateMachine<Context, any, any>>;

enum States {
  Init = "init",
  Wait = "wait",
  GetFlightPlans = "getFlightPlans",
}

type Context = {
  token: string;
  username: string;
};

const config: MachineConfig<Context, any, any> = {
  initial: States.Init,
  id: "systemMonitor",
  states: {
    [States.Init]: {
      after: {
        1: States.Wait,
      },
    },
    [States.Wait]: {
      after: {
        60000: [{ target: States.GetFlightPlans }],
      },
    },
    [States.GetFlightPlans]: {
      invoke: {
        src: async (c) => {
          const ships = getShips();
          [
            ...new Set(
              ships
                .filter((p) => p.location)
                .map((p) => p.location!.substring(0, 2))
            ),
          ].map((system) => api.getFlightPlans(c.token!, c.username!, system));
        },
        onDone: States.Wait,
        onError: States.Wait,
      },
    },
  },
};

export const systemMonitorMachine = createMachine(
  debugMachineStates(config, () => getDebug().debugBuyAndUpgradeShipMachine)
);
