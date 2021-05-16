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
import { ShipContext } from "./ShipBaseContext";
import { printError, printErrorAction, print } from "./printError";
import { getCargoQuantity } from "./getCargoQuantity";
import { debugShipMachineStates } from "../debugStates";
import { persistStrategy } from "data/persistStrategy";
import { ShipStrategy } from "data/Strategy/ShipStrategy";
import { getRoute, getGraph } from "data/localStorage/graph";
import { getShip } from "data/localStorage/shipCache";
import { getCredits } from "data/localStorage/getCredits";
import { formatCurrency } from "./formatNumber";

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
  nextStop?: string;
} & ShipContext;

export type Actor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

const config: MachineConfig<Context, any, any> = {
  id: "travel",
  initial: States.GetShip,
  context: {
    id: "",
    token: "",
    username: "",
    ship: {} as Ship,
    destination: "",
    nextStop: "",
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
          else return getShip(c.id);
        },
      },
    },
    [States.BuyFuel]: {
      invoke: {
        src: async (c) => {
          const currentFuel = getCargoQuantity(c.ship.cargo, "FUEL");
          const neededFuel = c.neededFuel! - currentFuel;

          if (neededFuel > c.ship.spaceAvailable) {
            console.log("need more fuel than have space");
            const sellGood = c.ship.cargo!.find((p) => p.good !== "FUEL")!.good;
            console.warn(
              `[${
                getShip(c.id).name
              }] Selling 1x${sellGood} to make room for ${neededFuel} fuel`
            );
            if (!c.ship.location) throw new Error("No ship location!");
            await api.sellOrder(
              c.token,
              c.username,
              c.id,
              sellGood,
              1,
              c.ship.location
            );
          }

          const fuel = await db.goodLocation
            .where("[location+good]")
            .equals([c.ship.location!, "FUEL"])
            .last();
          const cost = fuel!.purchasePricePerUnit * neededFuel;
          if (cost > getCredits()) {
            console.warn(
              `[${getShip(c.id).name}] Will wait, need ${formatCurrency(
                cost
              )}, but have ${formatCurrency(getCredits())}`
            );
            return States.Wait;
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
            target: States.Done,
            actions: printErrorAction(),
          },
        ],
        onDone: [
          { cond: (c, e: any) => e.data === States.Wait, target: States.Wait },
          {
            target: States.Idle,
            actions: assign<Context>({
              ship: (c, e: any) => e.data.ship,
            }) as any,
          },
        ],
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
        src: (c) =>
          api.newFlightPlan(
            c.token,
            c.username,
            c.id,
            c.ship.location!,
            c.nextStop!
          ),
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
          const { graph, warps } = getGraph();
          const route = getRoute(
            graph,
            c.ship.location!,
            c.destination,
            c.ship,
            warps
          );
          if (!route.length) throwError("Could not determine route!");
          return {
            neededFuel: route[0].fuelNeeded,
            nextStop: route[0].to.symbol,
          };
        },
        onError: printError(),
        onDone: {
          actions: assign<Context>({
            neededFuel: (_, e: any) => e.data.neededFuel,
            nextStop: (_, e: any) => e.data.nextStop,
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
          actions: assign<Context>({
            neededFuel: undefined,
            nextStop: undefined,
            ship: (c) => ({ ...c.ship, location: c.nextStop }),
            success: true,
            flightPlan: undefined,
          }) as any,
          target: States.Done,
        },
      ],
    },
  },
};

export const travelToLocationMachine = (shouldDebug: boolean = false) =>
  createMachine(debugShipMachineStates(config));
