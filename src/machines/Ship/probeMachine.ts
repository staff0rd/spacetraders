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
import { travelToLocationMachine } from "./travelToLocationMachine";
import { IProbe } from "../../data/IProbe";
import { getShipName } from "../../data/names";
import { confirmStrategy } from "./confirmStrategy";
import { FlightPlan } from "../../api/FlightPlan";

const debug = (_: string) => {
  return undefined;
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
  flightPlan?: FlightPlan;
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
    [States.Init]: initShipMachine("probe", States.ConfirmStrategy),
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
    [States.TravelToLocation]: {
      invoke: {
        src: (c) =>
          travelToLocationMachine.withContext({
            id: c.id,
            username: c.username,
            token: c.token,
            to: c.probe!,
            ship: c.ship!,
            shipName: c.shipName,
          }),
        onDone: {
          target: States.Idle,
          actions: assign<Context>({
            ship: (c, e: any) => e.data,
            flightPlan: undefined,
          }),
        },
      },
      on: {
        FLIGHTPLAN_UPDATE: {
          actions: assign<Context>({ flightPlan: (c, e: any) => e.data }),
        },
      },
    },
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

function initShipMachine<TContext extends ShipBaseContext>(
  machineName: string,
  nextState: any
) {
  return {
    entry: debug(machineName),
    invoke: {
      src: async (c: TContext) => {
        const data = await api.getShip(c.token, c.username, c.id);
        return { ship: data.ship, shipName: await getShipName(c.id) };
      },
      onDone: {
        target: nextState,
        actions: assign<TContext>({
          ship: (c, e: any) => e.data.ship,
          shipName: (c, e: any) => e.data.shipName,
        }) as any,
      },
    },
  };
}
