import {
  ActorRefFrom,
  assign,
  createMachine,
  EventObject,
  MachineConfig,
  StateMachine,
  MachineOptions,
} from "xstate";
import { ShipBaseContext, ShipContext } from "./ShipBaseContext";
import * as api from "../../api";
import { getProbeAssignment } from "../../data/getProbeAssignment";
import { DateTime } from "luxon";
import { IProbe } from "../../data/IProbe";
import { confirmStrategy } from "./confirmStrategy";
import { travelToLocation } from "./travelToLocation";
import { debugShipMachineStates } from "../debugStates";
import { getDebug } from "../../data/localStorage/getDebug";
import { printErrorAction } from "./printError";
import * as ships from "data/ships";
import { getShip, newOrder } from "data/localStorage/shipCache";
import { ShipOrders } from "data/IShipOrder";

export enum States {
  Idle = "idle",
  GetAssignment = "getAssignment",
  Probe = "probe",
  WaitAfterErorr = "waitAfterError",
  Waiting = "waiting",
  ConfirmStrategy = "confirmStrategy",
  TravelToLocation = "travelToLocation",
  Done = "done",
}

const PROBE_DELAY_SECONDS = 30;

export type Context = ShipBaseContext & {
  probe?: IProbe;
  lastProbe?: DateTime;
};

export type Actor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

const config: MachineConfig<Context, any, any> = {
  id: "probe",
  initial: States.ConfirmStrategy,
  states: {
    [States.Idle]: {
      after: {
        1: [
          {
            target: States.Done,
            cond: (c) => !c.probe,
            actions: "revertToTrade",
          },
          {
            target: States.TravelToLocation,
            cond: (c) => {
              const ship = getShip(c.id);
              const hasLocation = !!ship.location;
              const isAtProbeLocation =
                c.probe!.location === ship.location?.symbol;
              return !hasLocation || !isAtProbeLocation;
            },
          },
          {
            target: States.Probe,
            cond: (c) =>
              !c.lastProbe ||
              -c.lastProbe.diffNow("seconds").seconds >= PROBE_DELAY_SECONDS,
          },
        ],
        10000: [{ target: States.ConfirmStrategy }],
      },
    },
    [States.TravelToLocation]: travelToLocation<Context>(
      (c) => c.probe?.location || getShip(c.id).flightPlan?.destination || "", // should never hit empty string
      States.Idle,
      getDebug().debugProbeMachine
    ),
    [States.Done]: {
      type: "final",
    },
    [States.GetAssignment]: {
      invoke: {
        src: (c) => getProbeAssignment(c.id),
        onDone: [
          {
            cond: (_, e: any) => !e.data,
            actions: "revertToTrade",
            target: States.Done,
          },
          {
            actions: assign<Context>({ probe: (c, e: any) => e.data }) as any,
            target: States.Idle,
          },
        ],
      },
    },
    [States.Probe]: {
      invoke: {
        src: async (c) => {
          try {
            await api.getMarket(c.token, getShip(c.id).location!.symbol);
            await api.getDockedShips(c.token, getShip(c.id).location!.symbol);
            await api.getStructures(c.token, getShip(c.id).location!.symbol);
          } catch (e) {
            console.error("Couldn't probe", e);
          }
          return true;
        },
        onDone: {
          actions: assign<Context>({ lastProbe: () => DateTime.now() }) as any,
          target: States.ConfirmStrategy,
        },
        onError: {
          actions: [printErrorAction()],
          target: States.WaitAfterErorr,
        },
      },
    },
    [States.WaitAfterErorr]: {
      after: {
        5000: States.ConfirmStrategy,
      },
    },
    [States.Waiting]: {
      after: {
        [PROBE_DELAY_SECONDS * 1000 * 60]: {
          target: States.Probe,
        },
      },
    },
    [States.ConfirmStrategy]: confirmStrategy(
      States.GetAssignment,
      States.Done,
      (c: ShipContext) => ships.clearProbes(c.id)
    ),
  },
};

const options: Partial<MachineOptions<Context, any>> = {
  actions: {
    revertToTrade: (c: Context) => {
      const message = "Nothing to probe, reverting to trade";
      console.warn(message);
      newOrder(c.id, ShipOrders.Trade, message);
    },
  },
};

export const probeMachine = createMachine(
  debugShipMachineStates(config),
  options
);
