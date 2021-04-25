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
import { persistStrategy } from "components/Strategy/persistStrategy";
import { printErrorAction } from "./printError";

enum States {
  ConfirmStrategy = "confirmStrategy",
  DetermineTradeRoute = "determineTradeRoute",
  Done = "done",
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
    shipName: "",
    ship: {} as Ship,
    strategy: { strategy: ShipStrategy.GoTo },
  },
  states: {
    [States.DetermineTradeRoute]: {
      invoke: {
        src: async (c) => {
          if (!c.ship.location || !c.strategy.data.location) {
            throw new Error("No route");
          }
          const tradeRoutes = await determineBestTradeRouteByRoute(
            c.ship.type,
            c.ship.maxCargo,
            c.ship.location,
            c.strategy.data.location
          );
          console.log(
            `${c.ship.location}>>${c.strategy.data.location}: `,
            tradeRoutes
          );
          const tradeRoute = tradeRoutes[0];
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
        },
        onDone: States.ConfirmStrategy,
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
      States.DetermineTradeRoute,
      States.Done
    ),
  },
};

export const gotoMachine = createMachine(debugShipMachineStates(config));
