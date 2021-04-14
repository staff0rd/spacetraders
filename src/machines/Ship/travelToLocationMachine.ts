import {
  ActorRefFrom,
  assign,
  createMachine,
  EventObject,
  MachineConfig,
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
import { ShipContext } from "./ShipBaseContext";
import { printError, printErrorAction, print } from "./printError";
import { getCargoQuantity } from "./getCargoQuantity";
import { debugMachineStates } from "../debugStates";
import { persistStrategy } from "components/Strategy/persistStrategy";
import { ShipStrategy } from "data/Strategy/ShipStrategy";

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
  Wait = "wait",
}

export type Context = {
  token: string;
  username: string;
  ship: Ship;
  destination: string;
  flightPlan?: FlightPlan;
  neededFuel?: number;
  success?: boolean;
} & ShipContext;

export type Actor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

const config: MachineConfig<Context, any, any> = {
  id: "travel",
  initial: States.GetShip,
  context: {
    id: "",
    token: "",
    username: "",
    shipName: "",
    ship: {} as Ship,
    destination: "",
  },
  states: {
    [States.Wait]: {
      after: {
        10000: {
          target: States.Idle,
          //cond: (c, e: any) => e.data.code === 2004,
        },
      },
    },
    [States.Idle]: {
      after: {
        1: [
          {
            target: States.Done,
            actions: assign<Context>({ success: true }) as any,
            cond: (c) => c.destination === c.ship?.location,
          },
          {
            target: States.CalculateNeededFuel,
            cond: (c) => c.neededFuel === undefined && !!c.ship.location,
          },
          {
            target: States.GetFlightPlan,
            cond: (c) =>
              !c.ship.location && !c.flightPlan && !!c.ship.flightPlanId,
          },
          {
            target: States.GetShip,
            cond: (c) =>
              !c.ship.location && !c.flightPlan && !c.ship.flightPlanId,
          },
          { target: States.InTransit, cond: (c) => !!c.flightPlan },
          {
            target: States.BuyFuel,
            cond: (c) => getCargoQuantity(c.ship.cargo, "FUEL") < c.neededFuel!,
          },
          { target: States.CreateFlightPlan, cond: (c) => !!c.ship.location },
        ],
      },
    },
    [States.Done]: {
      type: "final",
      data: {
        ship: (c: Context) => {
          if (c.success) return { ...c.ship, location: c.destination };
          else return c.ship;
        },
      },
    },
    [States.BuyFuel]: {
      invoke: {
        src: async (c) => {
          const currentFuel = getCargoQuantity(c.ship.cargo, "FUEL");
          const neededFuel = c.neededFuel! - currentFuel;

          if (neededFuel > c.ship.spaceAvailable) {
            const sellGood = c.ship.cargo!.find((p) => p.good !== "FUEL")!.good;
            console.warn(
              `[${c.shipName}] Selling 1x${sellGood} to make room for ${neededFuel} fuel`
            );
            await api.sellOrder(c.token, c.username, c.id, sellGood, 1);
          }
          const result = await api.purchaseOrder(
            c.token,
            c.username,
            c.id,
            "FUEL",
            neededFuel,
            c.ship.location!,
            0
          );

          return result;
        },
        onError: [
          {
            cond: (c, e: any) => e.data.code === 2001,
            actions: [
              print("No fuel at this location"),
              assign<Context>({ success: false }) as any,
              (c) =>
                persistStrategy(c.id, ShipStrategy.Halt, ShipStrategy.Halt),
            ],
            target: States.Done,
          },
          {
            cond: (c, e: any) => e.data?.code !== 2001,
            target: States.Wait,
            actions: printErrorAction(),
          },
        ],
        onDone: {
          target: States.Idle,
          actions: assign<Context>({
            ship: (c, e: any) => e.data.ship,
          }) as any,
        },
      },
    },
    [States.GetShip]: {
      invoke: {
        src: (c) => db.ships.get(c.id),
        onDone: {
          actions: assign<Context>({ ship: (c, e: any) => e.data }) as any,
          target: States.Idle,
        },
      },
    },
    [States.GetFlightPlan]: {
      invoke: {
        src: (c) =>
          api.getFlightPlan(c.token, c.username, c.ship.flightPlanId!),
        onDone: {
          actions: [
            assign<Context>({
              flightPlan: (c, e: any) => e.data.flightPlan,
            }) as any,
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
        src: (c) => api.newFlightPlan(c.token, c.username, c.id, c.destination),
        onError: {
          actions: printErrorAction(),
          target: States.Idle,
        },
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
          if (!c.ship.location) throwError("Couldn't find departure");
          const from = await db.probes.get(c.ship.location!);
          if (!from) throwError("Couldn't find departure");
          else {
            const to = await db.probes.get(c.destination);
            if (!to) throwError("Couldn't find destination");
            else {
              const distance = getDistance(from.x, from.y, to.x, to.y);
              const neededFuel = getFuelNeeded(
                distance,
                from.type,
                c.ship.type
              );
              return neededFuel;
            }
          }
        },
        onError: printError(),
        onDone: {
          actions: assign<Context>({
            neededFuel: (_, e: any) => e.data,
          }) as any,
          target: States.Idle,
        },
      },
    },
    [States.InTransit]: {
      after: [
        {
          delay: (c) => {
            const result = DateTime.fromISO(c.flightPlan!.arrivesAt).diffNow(
              "milliseconds"
            ).milliseconds;
            return result;
          },
          actions: assign<Context>({ success: true }) as any,
          target: States.Done,
        },
      ],
    },
  },
};

export const travelToLocationMachine = (shouldDebug: boolean = false) =>
  createMachine(
    debugMachineStates(
      { ...config, id: `${config.id}-debug-${shouldDebug}` },
      shouldDebug
    )
  );
