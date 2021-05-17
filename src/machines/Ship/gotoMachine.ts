import {
  ActorRefFrom,
  createMachine,
  EventObject,
  StateMachine,
  MachineConfig,
} from "xstate";
import { Ship } from "../../api/Ship";
import db from "../../data";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import { ShipBaseContext } from "./ShipBaseContext";
import { confirmStrategy } from "./confirmStrategy";
import { debugShipMachineStates } from "machines/debugStates";
import { determineBestTradeRouteByRoute } from "./determineBestTradeRoute";
import { DateTime } from "luxon";
import { persistStrategy } from "data/persistStrategy";
import { printErrorAction } from "./printError";
import { travelToLocation } from "./travelToLocation";
import * as api from "api";

enum States {
  Idle = "idle",
  ConfirmStrategy = "confirmStrategy",
  DetermineTradeRoute = "determineTradeRoute",
  Done = "done",
  TravelToLocation = "travelToLocation",
  SwitchToTrade = "switchToTrade",
}

export type Context = ShipBaseContext;

export type Actor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

const config: MachineConfig<Context, any, any> = {
  id: "goto",
  initial: States.ConfirmStrategy,
  context: {
    id: "",
    token: "",
    username: "",
    ship: {} as Ship,
    strategy: { strategy: ShipStrategy.GoTo },
  },
  states: {
    [States.Idle]: {
      after: {
        1: [
          {
            cond: (c) => c.ship.location === c.strategy.data.location,
            target: States.SwitchToTrade,
          },
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
    [States.SwitchToTrade]: {
      invoke: {
        src: (c) =>
          persistStrategy(c.id, ShipStrategy.GoTo, ShipStrategy.Trade, false),
        onDone: States.Done,
      },
    },
    [States.DetermineTradeRoute]: {
      invoke: {
        src: async (c) => {
          if (!c.ship.location || !c.strategy.data.location) {
            const result = await api.getShip(c.token, c.username, c.id);
            if (result.ship.location)
              throw new Error("Had no location, but now do");
            throw new Error("No route");
          }
          const tradeRoutes = await determineBestTradeRouteByRoute(
            c.ship,
            c.ship.location,
            c.strategy.data.location
          );
          const tradeRoute = tradeRoutes[0];
          if (!tradeRoute) {
            return;
          }
          if (tradeRoute.totalProfit < 0) {
            tradeRoute.quantityToBuy = 0;
            tradeRoute.totalProfit = 0;
          }
          await db.tradeRoutes.put({
            ...tradeRoute,
            created: DateTime.local().toISO(),
            shipId: c.id,
          });
          persistStrategy(c.id, ShipStrategy.GoTo, ShipStrategy.Trade);
          return true;
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
    [States.ConfirmStrategy]: confirmStrategy(
      ShipStrategy.GoTo,
      States.Idle,
      States.Done
    ),
    [States.TravelToLocation]: {
      ...travelToLocation<Context>(
        (c) => c.flightPlan?.destination || c.strategy.data.location,
        States.SwitchToTrade,
        false
      ),
    },
  },
};

export const gotoMachine = createMachine(debugShipMachineStates(config));
