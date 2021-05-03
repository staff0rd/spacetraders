import {
  ActorRefFrom,
  assign,
  createMachine,
  EventObject,
  sendParent,
  StateMachine,
  MachineConfig,
  MachineOptions,
} from "xstate";
import * as api from "../../api";
import { Ship } from "../../api/Ship";
import { DateTime } from "luxon";
import db from "../../data";
import { TradeType } from "../../data/ITrade";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import { confirmStrategy } from "./confirmStrategy";
import { initShipMachine } from "./initShipMachine";
import {
  determineBestTradeRouteByCurrentLocation,
  determineClosestBestTradeRoute,
} from "./determineBestTradeRoute";
import { TradeRoute } from "./TradeRoute";
import { debugShipMachine } from "./debugMachine";
import { travelToLocation } from "./travelToLocation";
import { ShipBaseContext } from "./ShipBaseContext";
import { printErrorAction, print } from "./printError";
import { debugShipMachineStates } from "../debugStates";
import { getCargoQuantity } from "./getCargoQuantity";
import { persistStrategy } from "../../components/Strategy/persistStrategy";
import { IShipDetail } from "../../data/IShipDetail";
import { getDebug } from "../../data/localStorage/getDebug";
import { getCredits } from "data/localStorage/getCredits";
import { formatCurrency } from "./formatNumber";
import { newTradeRoute } from "api/saveTradeData";

const MAX_CARGO_MOVE = 500;

export type ShouldBuy = {
  good: string;
  quantity: number;
  profit: number;
  sellTo?: string;
};

enum States {
  Idle = "idle",
  Init = "init",
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
  tradeRoute?: TradeRoute;
  gotMarket?: boolean;
};

export type ShipActor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

const config: MachineConfig<Context, any, any> = {
  id: "trade",
  initial: States.Init,
  context: {
    id: "",
    token: "",
    username: "",
    ship: {} as Ship,
    shipName: "",
    gotMarket: false,
    strategy: { strategy: ShipStrategy.Trade },
  },
  states: {
    [States.Init]: initShipMachine<Context>(States.GetTradeRoute),
    [States.GetTradeRoute]: {
      invoke: {
        src: async (c) => {
          const route = await db.tradeRoutes
            .where("shipId")
            .equals(c.id)
            .reverse();
          return route.first();
        },
        onDone: {
          actions: assign<Context>({
            tradeRoute: (c, e: any) => e.data,
          }) as any,
          target: States.Idle,
        },
      },
    },
    [States.Idle]: {
      after: {
        1: [
          { target: States.TravelToLocation, cond: (c) => !!c.flightPlan },
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
            cond: (c) => !!c.shouldCheckStrategy,
          },
          {
            target: States.Idle,
            cond: (c) =>
              !!c.ship.location &&
              c.tradeRoute?.sellLocation === c.ship.location,
            actions: assign<Context>({ tradeRoute: undefined }),
          },
          {
            target: States.DetermineTradeRoute,
            cond: (c) => debugCond(c, shouldDetermineTradeRoute),
          },
          {
            target: States.BuyCargo,
            cond: (c) => atBuyLocationWaitingToBuy(c),
          },
          {
            target: States.TravelToLocation,
            cond: (c) => !c.flightPlan && !!c.tradeRoute,
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
        (c) => c.tradeRoute?.sellLocation || c.flightPlan!.destination,
        States.Idle,
        getDebug().debugTradeMachine
      ),
    },
    [States.DetermineTradeRoute]: {
      invoke: {
        src: async (c) => {
          const tradeRoutes = await determineBestTradeRouteByCurrentLocation(
            c.ship.type,
            c.ship.maxCargo,
            c.ship.location
          );

          if (tradeRoutes.length) {
            const tradeRoute = tradeRoutes[0];
            console.log(
              `Rank: ${tradeRoute.rank}, ${tradeRoute.buyLocation}->${tradeRoute.sellLocation} ${tradeRoute.good}`
            );
            await newTradeRoute(tradeRoute, c.id);
            return tradeRoute;
          }

          const closest = await determineClosestBestTradeRoute(
            c.ship.type,
            c.ship.maxCargo,
            c.ship.location
          );

          if (closest.length) {
            const message = `[${c.shipName}] Going to closest: ${closest[0].route.buyLocation}`;
            console.warn(message);
            persistStrategy(
              c.id,
              ShipStrategy.Trade,
              ShipStrategy.GoTo,
              false,
              { location: closest[0].route.buyLocation }
            );
            throw new Error(message);
          } else {
            console.warn("No trade routes, switching to probe");
            persistStrategy(
              c.id,
              ShipStrategy.Trade,
              ShipStrategy.Probe,
              false
            );
            throw new Error("No trade routes, switching to probe");
          }
        },
        onError: States.Done,
        onDone: [
          {
            actions: assign<Context>({
              tradeRoute: undefined,
            }) as any,
            cond: (c, e: any) => typeof e.data === "string",
            target: States.TravelToLocation,
          },
          {
            target: States.Idle,
            actions: assign<Context>({
              tradeRoute: (c, e: any) => e.data,
            }) as any,
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
            (p) => p.good !== "FUEL" || c.tradeRoute?.good === "FUEL"
          );

          if (c.tradeRoute && c.tradeRoute.buyLocation === ship.location) {
            const fuelOverage =
              getCargoQuantity(ship.cargo, "FUEL") - c.tradeRoute!.fuelNeeded;
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
            if (!c.ship.location) throw new Error("No ship location");
            result = await api.sellOrder(
              c.token,
              c.username,
              c.id,
              sellOrder.good,
              quantity,
              c.ship.location!
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
              location: c.ship.location!,
              shipId: c.id,
              timestamp: DateTime.now().toISO(),
              profit,
            });
          }
          const totalProfit = runningProfit.reduce((a, b) => a + b, 0);
          await db.shipDetail
            .where("shipId")
            .equals(c.id)
            .modify({
              lastProfit: totalProfit,
              lastProfitCreated: DateTime.now().toISO(),
            } as Partial<IShipDetail>);
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
            actions: [
              assign({
                ship: (c, e: any) => e.data.ship,
              }) as any,
              "shipUpdate",
            ],
          },
          {
            target: States.ConfirmStrategy,
            actions: [
              assign({
                ship: (c, e: any) => e.data.ship,
              }) as any,
              "shipUpdate",
            ],
          },
        ],
      },
    },
    [States.GetMarket]: {
      invoke: {
        src: (context: Context) =>
          api.getMarket(context.token, context.ship.location!),
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
      ShipStrategy.Trade,
      States.Idle,
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
              c.tradeRoute!.quantityToBuy -
                getCargoQuantity(ship.cargo, c.tradeRoute!.good)
            );
            const cost = quantity * c.tradeRoute!.purchasePricePerUnit;
            if (cost > getCredits()) {
              console.warn(
                `[${c.shipName}] Will wait, need ${formatCurrency(
                  cost
                )}, but have ${formatCurrency(getCredits())}`
              );
              return { bought: false, ship: result.ship };
            }
            result = await api.purchaseOrder(
              c.token,
              c.username,
              c.id,
              c.tradeRoute!.good,
              quantity,
              c.tradeRoute!.buyLocation,
              c.tradeRoute!.profitPerUnit * quantity
            );
            ship = result.ship!;
          } while (
            result.ship!.cargo.find((g) => g.good === c.tradeRoute!.good)!
              .quantity < c.tradeRoute!.quantityToBuy
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
            actions: [
              assign({
                ship: (c, e: any) => e.data.ship,
              }) as any,
              "shipUpdate",
            ],
          },
          {
            target: States.Wait,
            cond: (c, e: any) =>
              (e.data.ship as Ship).cargo.filter(
                (p) => p.good === c.tradeRoute!.good
              ).length > 1,
            actions: [
              assign({
                ship: (c, e: any) => e.data.ship,
              }) as any,
              "shipUpdate",
            ],
          },
          {
            target: States.Wait,
            actions: [
              assign({
                ship: (c, e: any) => e.data.ship,
                tradeRoute: undefined, // no cargo so clear the traderoute
              }) as any,
              "shipUpdate",
            ],
          },
        ],
      },
    },
  },
};

const options: Partial<MachineOptions<Context, any>> = {
  actions: {
    shipUpdate: sendParent((c: Context) => ({
      type: "SHIP_UPDATE",
      data: c.ship,
    })),
  },
  guards: {
    shouldDone: (c) => c.strategy.strategy !== ShipStrategy.Trade,
  },
};

export const tradeMachine = createMachine(
  debugShipMachineStates(config),
  options
);

function atSellLocationWithSellableGoods(c: Context): boolean {
  const hasLocation = !!c.ship.location;
  const atSellLocation = c.tradeRoute?.sellLocation === c.ship.location;
  return (
    hasLocation &&
    atSellLocation &&
    getCargoQuantity(c.ship.cargo, c.tradeRoute!.good) > 0
  );
}

function atBuyLocationWithTooMuchFuel(c: Context): boolean {
  const hasLocation = !!c.ship.location;
  const hasTradeRoute = !!c.tradeRoute;
  const isBuyLocation = c.ship.location === c.tradeRoute?.buyLocation;
  return (
    hasLocation &&
    hasTradeRoute &&
    isBuyLocation &&
    c.tradeRoute?.good !== "FUEL" &&
    getCargoQuantity(c.ship.cargo, "FUEL") > c.tradeRoute!.fuelNeeded
  );
}

function atBuyLocationWaitingToBuy(c: Context): boolean {
  const hasTradeRoute = !!c.tradeRoute;
  const hasLocation = !!c.ship.location;
  const atBuyLocation = c.tradeRoute?.buyLocation === c.ship.location;
  return (
    hasTradeRoute &&
    hasLocation &&
    atBuyLocation &&
    getCargoQuantity(c.ship.cargo, c.tradeRoute!.good) <
      c.tradeRoute!.quantityToBuy
  );
}

function shouldDetermineTradeRoute(c: Context): boolean {
  const hasLocation = !!c.ship.location;
  const hasTradeRoute = !!c.tradeRoute;
  const atSellLocation = c.tradeRoute?.sellLocation === c.ship.location;
  return hasLocation && (!hasTradeRoute || atSellLocation);
}

function haveExcessCargo(c: Context): boolean {
  const hasTradeRoute = !!c.tradeRoute;
  const hasLocation = !!c.ship.location;
  const result =
    hasTradeRoute &&
    hasLocation &&
    c.ship.cargo.filter(
      (p) => p.good !== "FUEL" && p.good !== c.tradeRoute!.good
    ).length > 0;
  return result;
}

function debugCond(c: Context, cond: (c: Context) => boolean) {
  const result = cond(c);
  if (getDebug().focusShip === c.id) console.log(`${cond.name}: ${result}`);
  return result;
}
