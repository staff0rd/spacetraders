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
import { getSystemFromLocationSymbol } from "data/localStorage/getSystemFromLocationSymbol";

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
        src: (c) => getFlightPlans(c.token, c.username),
        onDone: States.Wait,
        onError: {
          target: States.Wait,
          actions: (c: Context, e: any) =>
            console.error("Failed to get flightplans", e.data),
        },
      },
    },
  },
};

export const getFlightPlans = async (token: string, username: string) => {
  const ships = getShips();
  [
    ...new Set(
      ships
        .filter((p) => p.location)
        .map((p) => getSystemFromLocationSymbol(p.location!))
    ),
  ].map((system) => api.getFlightPlans(token, username, system));
};

export const systemMonitorMachine = createMachine(
  debugMachineStates(config, () => getDebug().debugBuyAndUpgradeShipMachine)
);
