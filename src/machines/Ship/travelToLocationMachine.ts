import {
  ActorRefFrom,
  assign,
  createMachine,
  EventObject,
  sendParent,
  StateMachine,
} from "xstate";
import { Ship } from "../../api/Ship";
import db from "../../data";
import { FlightPlan } from "../../api/FlightPlan";
import * as api from "../../api";
import { DateTime } from "luxon";
import { getFuelNeeded } from "../../data/getFuelNeeded";
import { getDistance } from "../getDistance";
import { IProbe } from "../../data/IProbe";
import { debug } from "./debug";
import { ShipContext } from "./ShipBaseContext";

const throwError = (message: string) => {
  console.warn(message);
  throw new Error(message);
};

enum States {
  Idle = "idle",
  InTransit = "InTransit",
  BuyFuel = "buyFuel",
  GetShip = "getShip",
  GetFlightPlan = "getFlightPlan",
  CreateFlightPlan = "createFlightPlan",
  CalculateNeededFuel = "calculateNeededFuel",
  Done = "done",
}

export type Context = {
  token: string;
  username: string;
  ship: Ship;
  to: IProbe;
  flightPlan?: FlightPlan;
  boughtFuel?: boolean;
  neededFuel?: number;
} & ShipContext;

export type Actor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

export const travelToLocationMachine = createMachine<Context, any, any>({
  id: "travel",
  initial: States.Idle,
  context: {
    id: "",
    token: "",
    username: "",
    shipName: "",
    ship: {} as Ship,
    to: {} as IProbe,
    boughtFuel: false,
  },
  states: {
    [States.Idle]: {
      entry: debug("travel"),
      after: {
        1: [
          {
            target: States.Done,
            cond: (c) => c.to.location === c.ship?.location,
          },
          {
            target: States.CalculateNeededFuel,
            cond: (c) => c.neededFuel === undefined,
          },
          {
            target: States.GetFlightPlan,
            cond: (c) => !c.ship.location && !c.flightPlan,
          },
          { target: States.InTransit, cond: (c) => !!c.flightPlan },
          {
            target: States.BuyFuel,
            cond: (c) => !c.boughtFuel && haveFuel(c) < c.neededFuel!,
          },
          { target: States.CreateFlightPlan, cond: (c) => !!c.ship.location },
          // {
          //   target: States.GetShip,
          //   cond: (c) => !c.ship.location && !c.ship.flightPlanId,
          // },
        ],
      },
    },
    [States.Done]: { entry: debug("travel"), type: "final" },
    [States.BuyFuel]: {
      entry: debug("travel"),
      invoke: {
        src: async (c) => {
          const from = await db.probes.get(c.ship.location!);
          if (!from) throwError("Couldn't find departure");
          else {
            const to = await db.probes.get(c.to.location);
            if (!to) throwError("Couldn't find destination");
            else {
              const distance = getDistance(from.x, from.y, to.x, to.y);
              const neededFuel = getFuelNeeded(distance, from.type);

              if (neededFuel > c.ship.spaceAvailable)
                throwError(
                  `Fuel: Have ${haveFuel(
                    c
                  )}, need ${neededFuel}, not enough space for fuel`
                );
              else {
                console.warn(`Buying ${neededFuel} fuel`);
                const result = await api.purchaseOrder(
                  c.token,
                  c.username,
                  c.id,
                  "FUEL",
                  neededFuel,
                  from.location,
                  0
                );

                return result;
              }
            }
          }
        },
        onError: States.Idle,
        onDone: {
          target: States.Idle,
          actions: assign<Context>({
            ship: (c, e: any) => e.data.ship,
          }) as any,
        },
      },
    },
    [States.GetShip]: {
      entry: debug("travel"),
      invoke: {
        src: (c) => api.getShip(c.token, c.username, c.id),
        onDone: {
          actions: assign<Context>({ ship: (c, e: any) => e.data.ship }),
          target: States.Idle,
        },
      },
    },
    [States.GetFlightPlan]: {
      entry: debug("travel"),
      invoke: {
        src: (c) =>
          api.getFlightPlan(c.token, c.username, c.ship.flightPlanId!),
        onDone: {
          actions: [
            assign<Context>({
              flightPlan: (c, e: any) => e.data.flightPlan,
            }),
            sendParent((c, e: any) => ({
              type: "FLIGHTPLAN_UPDATE",
              data: e.data.flightPlan,
            })),
          ],
          target: States.Idle,
        },
      },
    },
    [States.CreateFlightPlan]: {
      invoke: {
        src: (c) =>
          api.newFlightPlan(c.token, c.username, c.id, c.to.location!),
        onDone: {
          target: States.InTransit,
          actions: [
            assign({
              flightPlan: (c, e: any) => e.data.flightPlan,
              ship: (c, e: any) => ({
                ...c.ship!,
                cargo: [
                  ...c.ship!.cargo.map((c) =>
                    c.good !== "FUEL"
                      ? c
                      : {
                          ...c,
                          quantity: (e.data.flightPlan as FlightPlan)
                            .fuelRemaining,
                        }
                  ),
                ],
              }),
            }),
            sendParent((c, e: any) => ({
              type: "FLIGHTPLAN_UPDATE",
              data: e.data.flightPlan,
            })),
          ],
        },
      },
    },
    [States.CalculateNeededFuel]: {
      invoke: {
        src: async (c: Context) => {
          if (!c.ship.location) return 0;
          const from = await db.probes.get(c.ship.location!);
          if (!from) throwError("Couldn't find departure");
          else {
            const to = await db.probes.get(c.to.location);
            if (!to) throwError("Couldn't find destination");
            else {
              const distance = getDistance(from.x, from.y, to.x, to.y);
              const neededFuel = getFuelNeeded(distance, from.type);

              const currentFuel = haveFuel(c);

              if (currentFuel >= neededFuel) return 0;

              if (neededFuel > c.ship.spaceAvailable)
                throwError(
                  `Fuel: Have ${haveFuel(
                    c
                  )}, need ${neededFuel}, not enough space for fuel`
                );
              return neededFuel;
            }
          }
        },
        onDone: {
          actions: assign<Context>({ neededFuel: (_, e: any) => e.data }),
          target: States.Idle,
        },
      },
    },
    [States.InTransit]: {
      entry: debug("travel"),
      after: [
        {
          delay: (c) => {
            const result = DateTime.fromISO(c.flightPlan!.arrivesAt).diffNow(
              "milliseconds"
            ).milliseconds;
            return result;
          },
          target: States.Done,
        },
      ],
    },
  },
});

function haveFuel(c: Context) {
  return c.ship.cargo.find((c) => c.good === "FUEL")?.quantity || 0;
}
