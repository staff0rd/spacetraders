import {
  ActorRefFrom,
  assign,
  createMachine,
  EventObject,
  MachineConfig,
  StateMachine,
} from "xstate";
import db from "../../data";
import * as api from "../../api";
import { DateTime } from "luxon";
import { ShipContext } from "./ShipBaseContext";
import { printError, printErrorAction, print } from "./printError";
import { getCargoQuantity } from "./getCargoQuantity";
import { debugShipMachineStates } from "../debugStates";
import { getRoute, getGraph } from "data/localStorage/graph";
import { getShip, newOrder } from "data/localStorage/shipCache";
import { getCredits } from "data/localStorage/getCredits";
import { formatCurrency } from "./formatNumber";
import { ShipOrders } from "data/IShipOrder";

const throwError = (message: string) => {
  console.warn(message);
  throw new Error(message);
};

enum States {
  Idle = "idle",
  InTransit = "InTransit",
  BuyFuel = "buyFuel",
  CreateFlightPlan = "createFlightPlan",
  CalculateNeededFuel = "calculateNeededFuel",
  Done = "done",
  Wait = "wait",
}

export type Context = {
  token: string;
  username: string;
  destination: string;
  neededFuel?: number;
  success?: boolean;
  nextStop?: string;
} & ShipContext;

export type Actor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

const config: MachineConfig<Context, any, any> = {
  id: "travel",
  initial: States.Idle,
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
            cond: (c) => c.destination === getShip(c.id).location?.symbol,
          },
          {
            target: States.CalculateNeededFuel,
            cond: (c) => c.neededFuel === undefined && !!getShip(c.id).location,
          },
          { target: States.InTransit, cond: (c) => !!getShip(c.id).flightPlan },
          {
            target: States.BuyFuel,
            cond: (c) =>
              getCargoQuantity(getShip(c.id).cargo, "FUEL") < c.neededFuel!,
          },
          {
            target: States.CreateFlightPlan,
            cond: (c) => !!getShip(c.id).location,
          },
        ],
      },
    },
    [States.Done]: {
      type: "final",
    },
    [States.BuyFuel]: {
      invoke: {
        src: async (c) => {
          const currentFuel = getCargoQuantity(getShip(c.id).cargo, "FUEL");
          const neededFuel = c.neededFuel! - currentFuel;

          if (neededFuel > getShip(c.id).spaceAvailable) {
            console.log("need more fuel than have space");
            const sellGood = getShip(c.id).cargo!.find(
              (p) => p.good !== "FUEL"
            )!.good;
            console.warn(
              `[${
                getShip(c.id).name
              }] Selling 1x${sellGood} to make room for ${neededFuel} fuel`
            );
            if (!getShip(c.id).location) throw new Error("No ship location!");
            await api.sellOrder(
              c.token,
              c.username,
              c.id,
              sellGood,
              1,
              getShip(c.id).location!.symbol
            );
          }

          const fuel = await db.goodLocation
            .where("[location+good]")
            .equals([getShip(c.id).location!.symbol, "FUEL"])
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
            getShip(c.id).location!.symbol,
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
              (c) => newOrder(c.id, ShipOrders.Halt, "No fuel at location"),
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
          },
        ],
      },
    },
    [States.CreateFlightPlan]: {
      invoke: {
        src: (c) =>
          api.newFlightPlan(
            c.token,
            c.username,
            c.id,
            getShip(c.id).location!.symbol,
            c.nextStop!
          ),
        onError: {
          actions: printErrorAction(),
          target: States.Idle,
        },
        onDone: {
          target: States.InTransit,
        },
      },
    },
    [States.CalculateNeededFuel]: {
      invoke: {
        src: async (c: Context) => {
          const { graph, warps } = getGraph();
          const route = getRoute(
            graph,
            getShip(c.id).location!.symbol,
            c.destination,
            getShip(c.id),
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
            const result = DateTime.fromISO(
              getShip(c.id).flightPlan!.arrivesAt
            ).diffNow("milliseconds").milliseconds;
            return result;
          },
          actions: assign<Context>({
            neededFuel: undefined,
            nextStop: undefined,
            success: true,
          }) as any,
          target: States.Done,
        },
      ],
    },
  },
};

export const travelToLocationMachine = (shouldDebug: boolean = false) =>
  createMachine(debugShipMachineStates(config));
