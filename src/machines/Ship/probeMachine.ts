import {
  ActorRefFrom,
  assign,
  createMachine,
  EventObject,
  StateMachine,
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

export const debug = (_: string) => {
  return () => {
    //return undefined;
  };
}; //import { debug } from "./debug";

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

const PROBE_DELAY_MINUTES = 1;

export type Context = ShipBaseContext & {
  probe?: IProbe;
  lastProbe?: DateTime;
  system: string;
};

export type Actor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

export const probeMachine = createMachine<Context, any, any>({
  id: "probe",
  initial: States.Init,
  context: {
    id: "",
    token: "",
    username: "",
    shipName: "",
    ship: {} as Ship,
    strategy: { strategy: ShipStrategy.Probe },
    probe: undefined,
    system: "",
  },
  states: {
    [States.Init]: initShipMachine<Context>("probe", States.ConfirmStrategy),
    [States.Idle]: {
      entry: debug("probe"),
      after: {
        1: [
          { target: States.Done, cond: (c) => !c.probe },
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
      "probe",
      (c) => c.probe!.location,
      States.Idle
    ),
    [States.Done]: {
      entry: debug("probe"),
      type: "final",
    },
    [States.GetAssignment]: {
      entry: debug("probe"),
      invoke: {
        src: (c) => getProbeAssignment(c.system, c.id),
        onDone: [
          {
            cond: (_, e: any) => !e.data,
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
      entry: debug("probe"),
      invoke: {
        src: async (c) => {
          await api.getMarket(c.token, c.ship!.location!);
          await api.getDockedShips(c.token, c.ship!.location!);
        },
        onDone: {
          actions: assign<Context>({ lastProbe: () => DateTime.now() }) as any,
          target: States.ConfirmStrategy,
        },
        onError: States.WaitAfterErorr,
      },
    },
    [States.WaitAfterErorr]: {
      entry: debug("probe"),
      after: {
        5000: States.Init,
      },
    },
    [States.Waiting]: {
      entry: debug("probe"),
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
});
