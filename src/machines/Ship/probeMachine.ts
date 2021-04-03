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
import { confirmStrategy } from "./confirmStrategy";
import { FlightPlan } from "../../api/FlightPlan";

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
  initial: States.ConfirmStrategy,
  context: {
    id: "",
    token: "",
    username: "",
    ship: {} as Ship,
    strategy: { strategy: ShipStrategy.Probe },
    probe: undefined,
    system: "",
  },
  states: {
    [States.Init]: {
      entry: (c, e, d) => console.warn("probe: ", d.state.value),
      invoke: {
        src: (c) => api.getShip(c.token, c.username, c.id),
        onDone: {
          target: States.GetAssignment,
          actions: assign<Context>({ ship: (c, e: any) => e.data.ship }) as any,
        },
      },
    },
    [States.Idle]: {
      entry: (c, e, d) => console.warn("probe: ", d.state.value),
      after: {
        1: [
          { target: States.Done, cond: (c) => !c.probe },
          {
            target: States.TravelToLocation,
            cond: (c) =>
              !c.ship?.location || c.probe!.location !== c.ship.location,
          },

          { target: States.Probe, cond: (c) => !c.lastProbe }, // TODO: or datetime diff
        ],
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
          }),
        onDone: {
          target: States.Idle,
          actions: assign<Context>({ ship: (c, e: any) => e.data }),
        },
      },
      on: {
        FLIGHTPLAN_UPDATE: {
          actions: [
            (_, e: any) => console.warn("FLIGTPLAN REEEECECECE", e),
            assign<Context>({ flightPlan: (c, e: any) => e.data }),
          ],
        },
      },
    },
    [States.Done]: {
      entry: (c, e, d) => console.warn("probe: ", d.state.value),
      type: "final",
    },
    [States.GetAssignment]: {
      entry: (c, e, d) => console.warn("probe: ", d.state.value),
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
      entry: (c, e, d) => console.warn("probe: ", d.state.value),
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
      entry: (c, e, d) => console.warn("probe: ", d.state.value),
      after: {
        5000: States.Init,
      },
    },
    [States.Waiting]: {
      entry: (c, e, d) => console.warn("probe: ", d.state.value),
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
