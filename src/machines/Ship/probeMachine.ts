import {
  ActorRefFrom,
  assign,
  createMachine,
  EventObject,
  MachineConfig,
  StateMachine,
  MachineOptions,
} from "xstate";
import { Ship } from "../../api/Ship";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import { ShipBaseContext } from "./ShipBaseContext";
import * as api from "../../api";
import { getProbeAssignment } from "../../data/Strategy/getProbeAssignment";
import { DateTime } from "luxon";
import { IProbe } from "../../data/IProbe";
import { confirmStrategy } from "./confirmStrategy";
import { initShipMachine } from "./initShipMachine";
import { travelToLocation } from "./travelToLocation";
import { debugShipMachineStates } from "../debugStates";
import { getDebug } from "../../data/localStorage/getDebug";
import { persistStrategy } from "components/Strategy/persistStrategy";
import { printErrorAction } from "./printError";

enum States {
  Init = "init",
  Idle = "idle",
  GetAssignment = "getAssignment",
  Probe = "probe",
  WaitAfterErorr = "waitAfterError",
  Waiting = "waiting",
  ConfirmStrategy = "confirmStrategy",
  TravelToLocation = "travelToLocation",
  Done = "done",
}

const PROBE_DELAY_MINUTES = 2;

export type Context = ShipBaseContext & {
  probe?: IProbe;
  lastProbe?: DateTime;
};

export type Actor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

const config: MachineConfig<Context, any, any> = {
  id: "probe",
  initial: States.Init,
  context: {
    id: "",
    token: "",
    username: "",
    ship: {} as Ship,
    strategy: { strategy: ShipStrategy.Probe },
    probe: undefined,
  },
  states: {
    [States.Init]: initShipMachine<Context>(States.ConfirmStrategy),
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
            cond: (c) =>
              !c.ship?.location || c.probe!.location !== c.ship.location,
          },
          {
            target: States.Probe,
            cond: (c) =>
              !c.lastProbe ||
              -c.lastProbe.diffNow("minutes").minutes >= PROBE_DELAY_MINUTES,
          },
        ],
        10000: [{ target: States.ConfirmStrategy }],
      },
    },
    [States.TravelToLocation]: travelToLocation<Context>(
      (c) => c.probe?.location || c.flightPlan?.destination || "", // should never hit empty string
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
            await api.getMarket(c.token, c.ship!.location!);
            await api.getDockedShips(c.token, c.ship!.location!);
            await api.getStructures(c.token, c.ship!.location!);
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
        5000: States.Init,
      },
    },
    [States.Waiting]: {
      after: {
        [PROBE_DELAY_MINUTES * 1000 * 60]: {
          target: States.Probe,
        },
      },
    },
    [States.ConfirmStrategy]: confirmStrategy(
      ShipStrategy.Probe,
      States.GetAssignment,
      States.Done
    ),
  },
};

const options: Partial<MachineOptions<Context, any>> = {
  actions: {
    revertToTrade: (c: Context) => {
      console.warn("Nothing to probe, reverting to trade");
      persistStrategy(c.id, ShipStrategy.Trade, ShipStrategy.Trade, false);
    },
  },
};

export const probeMachine = createMachine(
  debugShipMachineStates(config),
  options
);
