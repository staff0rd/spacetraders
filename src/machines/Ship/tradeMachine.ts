import {
  ActorRefFrom,
  assign,
  createMachine,
  EventObject,
  StateMachine,
  MachineConfig,
} from "xstate";
import * as api from "../../api";
import { Ship } from "../../api/Ship";
import { DateTime } from "luxon";
import db from "../../data";
import { TradeType } from "../../data/ITrade";
import { confirmStrategy } from "./confirmStrategy";
import {
  determineBestTradeRouteByCurrentLocation,
  determineClosestBestTradeRoute,
} from "./determineBestTradeRoute";
import { debugShipMachine } from "./debugMachine";
import { travelToLocation } from "./travelToLocation";
import { ShipBaseContext } from "./ShipBaseContext";
import { printErrorAction, print } from "./printError";
import { debugShipMachineStates } from "../debugStates";
import { getCargoQuantity } from "./getCargoQuantity";
import { getDebug } from "../../data/localStorage/getDebug";
import { getCredits } from "data/localStorage/getCredits";
import { formatCurrency } from "./formatNumber";
import { getLastTradeData, newTradeRoute } from "data/tradeData";
import { getShip, newOrder } from "data/localStorage/shipCache";
import { ITradeRouteData } from "data/ITradeRouteData";
import { ShipOrders } from "data/IShipOrder";
import { reportLastProfit } from "data/ships";

const MAX_CARGO_MOVE = 500;

export type ShouldBuy = {
  good: string;
  quantity: number;
  profit: number;
  sellTo?: string;
};

export enum States {
  Idle = "idle",
  BuyCargo = "buyCargo",
  SellCargo = "sellCargo",
  Done = "done",
  ConfirmStrategy = "confirmStrategy",
  DetermineTradeRoute = "determineTradeRoute",
  GetMarket = "getMarket",
  GetTradeRoute = "getTradeRoute",
  TravelToLocation = "travelToLocation",
  Wait = "wait",
}

export type Context = ShipBaseContext & {
  tradeData?: ITradeRouteData;
  gotMarket?: boolean;
  testId?: string;
  goto?: string;
};

export type ShipActor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

const config: MachineConfig<Context, any, any> = {
  id: "trade",
  initial: States.GetTradeRoute,
  states: {
    [States.GetTradeRoute]: {
      invoke: {
        src: async (c) => {
          const data = await getLastTradeData(c.id);
          return data;
        },
        onDone: {
          actions: assign<Context>({
            tradeData: (c, e: any) => e.data,
          }) as any,
          target: States.Idle,
        },
      },
    },
    [States.Idle]: {
      after: {
        1: [
          {
            target: States.TravelToLocation,
            cond: (c) => !!getShip(c.id).flightPlan,
          },
          { target: States.GetMarket, cond: (c) => !c.gotMarket },
          {
            target: States.SellCargo,
            cond: (c) =>
              debugCond(c, atSellLocationWithSellableGoods) ||
              debugCond(c, atBuyLocationWithTooMuchFuel) ||
              debugCond(c, haveExcessCargo),
          },
          {
            target: States.ConfirmStrategy,
            cond: (c) => !!c.shouldCheckOrders,
          },
          {
            target: States.Idle,
            cond: (c) =>
              !!getShip(c.id).location &&
              c.tradeData?.tradeRoute.sellLocation ===
                getShip(c.id).location?.symbol,
            actions: assign<Context>({ tradeData: undefined }),
          },
          {
            target: States.DetermineTradeRoute,
            cond: (c) => debugCond(c, shouldDetermineTradeRoute),
          },
          {
            target: States.BuyCargo,
            cond: (c) => debugCond(c, atBuyLocationWaitingToBuy),
          },
          {
            target: States.TravelToLocation,
            cond: (c) => !getShip(c.id).flightPlan && !!c.tradeData,
          },
          {
            target: States.Done,
            actions: debugShipMachine(
              () => true,
              "trade",
              "Nothing left to do"
            ),
          },
        ],
      },
    },
    [States.TravelToLocation]: {
      ...travelToLocation<Context>(
        (c) =>
          c.goto ||
          c.tradeData?.tradeRoute.sellLocation ||
          getShip(c.id).flightPlan!.destination,
        States.Idle,
        getDebug().debugTradeMachine
      ),
    },
    [States.DetermineTradeRoute]: {
      invoke: {
        src: async (c) => {
          const ship = getShip(c.id);
          const tradeRoutes = await determineBestTradeRouteByCurrentLocation(
            ship,
            ship.location!.symbol
          );

          if (tradeRoutes.length) {
            const tradeRoute = tradeRoutes[0];
            console.log(
              `[${ship.name}] Rank: ${tradeRoute.rank}, ${tradeRoute.buyLocation}->${tradeRoute.sellLocation} ${tradeRoute.good}`
            );
            await newTradeRoute(tradeRoute, c.id);
            return tradeRoute;
          }

          const closest = await determineClosestBestTradeRoute(
            ship,
            ship.location?.symbol
          );

          if (closest.length) {
            const message = `[${getShip(c.id).name}] Going to closest: ${
              closest[0].route.buyLocation
            }`;
            console.warn(message);
            return { goto: closest[0].route.buyLocation };
          } else {
            const message = "No trade routes, switching to probe";
            console.warn(message);
            newOrder(c.id, ShipOrders.Probe, message);
          }
        },
        onError: { target: States.Done, actions: printErrorAction() },
        onDone: [
          {
            cond: (c, e: any) => !e.data,
            target: States.Done,
          },
          {
            cond: (c, e: any) => e.data.goto,
            actions: assign({ goto: (c, e) => e.data.goto }),
            target: States.TravelToLocation,
          },
          {
            target: States.GetTradeRoute,
          },
        ],
      },
    },
    [States.Done]: {
      type: "final",
    },
    [States.SellCargo]: {
      invoke: {
        src: async (c) => {
          let ship: Ship = (await db.ships.where("id").equals(c.id).first())!;

          let result: Partial<api.PurchaseOrderResponse> = {
            ship: ship,
          };

          const toSell = ship.cargo.filter(
            (p) => p.good !== "FUEL" || c.tradeData?.tradeRoute.good === "FUEL"
          );

          if (
            c.tradeData &&
            c.tradeData.tradeRoute.buyLocation === ship.location
          ) {
            const fuelOverage =
              getCargoQuantity(ship.cargo, "FUEL") -
              c.tradeData!.tradeRoute.fuelNeeded;
            if (fuelOverage > 0)
              toSell.push({
                good: "FUEL",
                quantity: fuelOverage,
                totalVolume: fuelOverage,
              });
          }
          const runningProfit: number[] = [];
          for (const sellOrder of toSell) {
            const quantity = Math.min(
              MAX_CARGO_MOVE,
              getCargoQuantity(ship.cargo, sellOrder.good)
            );
            if (!getShip(c.id).location) throw new Error("No ship location");
            result = await api.sellOrder(
              c.token,
              c.username,
              c.id,
              sellOrder.good,
              quantity,
              getShip(c.id).location!.symbol
            );
            ship = result.ship!;
            const lastBuy = await db.trades
              .reverse()
              .filter(
                (p) =>
                  p.good === sellOrder.good &&
                  p.shipId === c.id &&
                  p.type === TradeType.Buy
              )
              .last();
            const profit = lastBuy
              ? (result!.order!.pricePerUnit -
                  lastBuy.cost / lastBuy.quantity) *
                quantity
              : undefined;
            runningProfit.push(profit || 0);
            await db.trades.put({
              cost: result!.order!.total,
              type: TradeType.Sell,
              good: sellOrder.good,
              quantity,
              location: getShip(c.id).location!.symbol,
              shipId: c.id,
              timestamp: DateTime.now().toISO(),
              profit,
            });
          }
          const totalProfit = runningProfit.reduce((a, b) => a + b, 0);
          await reportLastProfit(c.id, totalProfit);
          return result;
        },
        onError: {
          actions: printErrorAction(),
          target: States.Wait,
        },
        onDone: [
          {
            target: States.SellCargo,
            cond: (c) => debugCond(c, atSellLocationWithSellableGoods),
          },
          {
            target: States.ConfirmStrategy,
          },
        ],
      },
    },
    [States.GetMarket]: {
      invoke: {
        src: (context: Context) =>
          api.getMarket(context.token, getShip(context.id).location!.symbol),
        onError: {
          actions: printErrorAction(),
          target: States.Done,
        },
        onDone: {
          target: States.Idle,
          actions: assign<Context>({ gotMarket: () => true }) as any,
        },
      },
    },
    [States.ConfirmStrategy]: confirmStrategy(
      States.GetTradeRoute,
      States.Done
    ),
    [States.Wait]: {
      after: {
        10000: {
          target: States.Idle,
          //cond: (c, e: any) => e.data.code === 2004,
        },
      },
    },
    [States.BuyCargo]: {
      invoke: {
        src: async (c: Context) => {
          let ship = (await db.ships.where("id").equals(c.id).first())!;
          let result: Partial<api.PurchaseOrderResponse> = {
            ship,
          };

          do {
            const quantity = Math.min(
              MAX_CARGO_MOVE,
              c.tradeData!.tradeRoute.quantityToBuy -
                getCargoQuantity(ship.cargo, c.tradeData!.tradeRoute.good)
            );
            const cost =
              quantity * c.tradeData!.tradeRoute.purchasePricePerUnit;
            if (cost > getCredits()) {
              console.warn(
                `[${getShip(c.id).name}] Will wait, need ${formatCurrency(
                  cost
                )}, but have ${formatCurrency(getCredits())}`
              );
              return { bought: false, ship: result.ship };
            }
            result = await api.purchaseOrder(
              c.token,
              c.username,
              c.id,
              c.tradeData!.tradeRoute.good,
              quantity,
              c.tradeData!.tradeRoute.buyLocation,
              c.tradeData!.tradeRoute.profitPerUnit * quantity
            );
            ship = result.ship!;
          } while (
            result.ship!.cargo.find(
              (g) => g.good === c.tradeData!.tradeRoute.good
            )!.quantity < c.tradeData!.tradeRoute.quantityToBuy
          );

          return { bought: true, ship: result.ship };
        },
        onError: [
          //{code: 2004, message: "User has insufficient credits for transaction."},
          // {
          //   cond: (c, e: any) => e.data.code === 2004,
          //   target: States.Wait,
          // },
          {
            cond: (c, e: any) => e.data.code === 2006,
            target: States.DetermineTradeRoute,
            actions: [printErrorAction(), print("Changing trade route")],
          },
          {
            actions: printErrorAction(),
            target: States.Wait,
          },
        ],
        //{code: 2006, message: "Good quantity is not available on planet." },

        //target: States.GetMarket,
        onDone: [
          {
            target: States.Idle,
            cond: (c, e: any) => e.data.bought,
          },
          {
            target: States.Wait,
            cond: (c, e: any) =>
              (e.data.ship as Ship).cargo.filter(
                (p) => p.good === c.tradeData!.tradeRoute.good
              ).length > 1,
          },
          {
            target: States.Wait,
          },
        ],
      },
    },
  },
};

export const tradeMachine = () => createMachine(debugShipMachineStates(config));

function atSellLocationWithSellableGoods(c: Context): boolean {
  const hasLocation = !!getShip(c.id).location;
  const atSellLocation =
    c.tradeData?.tradeRoute.sellLocation === getShip(c.id).location?.symbol;
  return (
    hasLocation &&
    atSellLocation &&
    getCargoQuantity(getShip(c.id).cargo, c.tradeData!.tradeRoute.good) > 0
  );
}

function atBuyLocationWithTooMuchFuel(c: Context): boolean {
  const hasLocation = !!getShip(c.id).location;
  const hasTradeRoute = !!c.tradeData;
  const isBuyLocation =
    getShip(c.id).location?.symbol === c.tradeData?.tradeRoute.buyLocation;
  return (
    hasLocation &&
    hasTradeRoute &&
    isBuyLocation &&
    c.tradeData?.tradeRoute.good !== "FUEL" &&
    getCargoQuantity(getShip(c.id).cargo, "FUEL") >
      c.tradeData!.tradeRoute.fuelNeeded
  );
}

function atBuyLocationWaitingToBuy(c: Context): boolean {
  const hasTradeRoute = !!c.tradeData;
  const hasLocation = !!getShip(c.id).location;
  const atBuyLocation =
    c.tradeData?.tradeRoute.buyLocation === getShip(c.id).location?.symbol;
  const hasSpace =
    getCargoQuantity(getShip(c.id).cargo, c.tradeData!.tradeRoute.good) <
    c.tradeData!.tradeRoute.quantityToBuy;
  return hasTradeRoute && hasLocation && atBuyLocation && hasSpace;
}

function shouldDetermineTradeRoute(c: Context): boolean {
  const hasLocation = !!getShip(c.id).location;
  const hasTradeRoute = !!c.tradeData && c.tradeData.complete !== 1;
  const atSellLocation =
    c.tradeData?.tradeRoute.sellLocation === getShip(c.id).location?.symbol;
  return hasLocation && (!hasTradeRoute || atSellLocation);
}

function haveExcessCargo(c: Context): boolean {
  const hasTradeRoute = !!c.tradeData;
  const hasLocation = !!getShip(c.id).location;
  const result =
    hasTradeRoute &&
    hasLocation &&
    getShip(c.id).cargo.filter(
      (p) => p.good !== "FUEL" && p.good !== c.tradeData!.tradeRoute.good
    ).length > 0;
  return result;
}

function debugCond(c: Context, cond: (c: Context) => boolean) {
  const result = cond(c);
  if (getDebug().focusShip === c.id) console.log(`${cond.name}: ${result}`);
  return result;
}
