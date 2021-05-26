import {
  ActorRefFrom,
  createMachine,
  EventObject,
  StateMachine,
  MachineConfig,
} from "xstate";
import db from "../../data";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import { ShipBaseContext } from "./ShipBaseContext";
import { confirmStrategy } from "./confirmStrategy";
import { debugShipMachineStates } from "machines/debugStates";
import { determineBestTradeRouteByRoute } from "./determineBestTradeRoute";
import { DateTime } from "luxon";
import { printErrorAction } from "./printError";
import { travelToLocation } from "./travelToLocation";
import * as api from "api";
import * as shipCache from "data/localStorage/shipCache";

enum States {
  Idle = "idle",
  ConfirmStrategy = "confirmStrategy",
  DetermineTradeRoute = "determineTradeRoute",
  Done = "done",
  TravelToLocation = "travelToLocation",
  SwitchToTrade = "switchToTrade",
}

export type Context = ShipBaseContext & {
  destination: string;
};

export type Actor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

const config: MachineConfig<Context, any, any> = {
  id: "goto",
  initial: States.ConfirmStrategy,
  states: {
    [States.Idle]: {
      after: {
        1: [
          {
            cond: (c) =>
              !!c.flightPlan &&
              DateTime.fromISO(c.flightPlan.arrivesAt) > DateTime.local(),
            target: States.TravelToLocation,
          },
          { target: States.DetermineTradeRoute },
        ],
      },
    },
    [States.DetermineTradeRoute]: {
      invoke: {
        src: async (c) => {
          throw new Error("Not implemented");
          // const ship = shipCache.getShip(c.id);
          // if (!c.strategy.data.location) {
          //   throw new Error("No destination");
          // }
          // if (!c.ship.location) {
          //   console.warn(`[${ship.name}] Has no location, will query`);
          // }
          // const location =
          //   c.ship.location ??
          //   (await api.getShip(c.token, c.username, c.id)).ship.location;

          // if (!location) throw new Error("No departure location");

          // const tradeRoutes = await determineBestTradeRouteByRoute(
          //   c.ship,
          //   location!,
          //   c.strategy.data.location
          // );
          // const tradeRoute = tradeRoutes[0];
          // if (!tradeRoute) {
          //   return;
          // }
          // if (tradeRoute.totalProfit < 0) {
          //   tradeRoute.quantityToBuy = 0;
          //   tradeRoute.totalProfit = 0;
          // }
          // await db.tradeRoutes.put({
          //   ...tradeRoute,
          //   created: DateTime.local().toISO(),
          //   shipId: c.id,
          // });
          // persistStrategy(c.id, ShipStrategy.GoTo, ShipStrategy.Trade);
          // return true;
        },
        onDone: [
          { cond: (c, e) => e.data, target: States.ConfirmStrategy },
          { target: States.TravelToLocation },
        ],
        onError: {
          target: States.Done,
          actions: printErrorAction(),
        },
      },
    },
    [States.Done]: {
      type: "final",
    },
    [States.ConfirmStrategy]: confirmStrategy(States.Idle, States.Done),
    [States.TravelToLocation]: {
      ...travelToLocation<Context>(
        (c) => c.flightPlan?.destination || c.destination,
        States.SwitchToTrade,
        false
      ),
    },
  },
};

export const gotoMachine = createMachine(debugShipMachineStates(config));
