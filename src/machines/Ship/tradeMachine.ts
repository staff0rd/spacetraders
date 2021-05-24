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
import { debugShipMachine } from "./debugMachine";
import { travelToLocation } from "./travelToLocation";
import { ShipBaseContext } from "./ShipBaseContext";
import { printErrorAction, print } from "./printError";
import { debugShipMachineStates } from "../debugStates";
import { getCargoQuantity } from "./getCargoQuantity";
import { persistStrategy } from "../../data/persistStrategy";
import { IShipDetail } from "../../data/IShipDetail";
import { getDebug } from "../../data/localStorage/getDebug";
import { getCredits } from "data/localStorage/getCredits";
import { formatCurrency } from "./formatNumber";
import { getLastTradeData, newTradeRoute } from "data/tradeData";
import { getShip } from "data/localStorage/shipCache";
import { ITradeRouteData } from "data/ITradeRouteData";

const MAX_CARGO_MOVE = 500;

export type ShouldBuy = {
  good: string;
  quantity: number;
  profit: number;
  sellTo?: string;
};

export enum States {
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
  tradeData?: ITradeRouteData;
  gotMarket?: boolean;
};

export type ShipActor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

const config: MachineConfig<Context, any, any> = {
  id: "trade",
  initial: States.Init,
  states: {
    [States.Init]: initShipMachine<Context>(States.GetTradeRoute),
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
            cond: (c) => !!c.shouldCheckOrders,
          },
          {
            target: States.Idle,
            cond: (c) =>
              !!c.ship.location &&
              c.tradeData?.tradeRoute.sellLocation === c.ship.location,
            actions: assign<Context>({ tradeData: undefined }),
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
            cond: (c) => !c.flightPlan && !!c.tradeData,
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
          c.tradeData?.tradeRoute.sellLocation || c.flightPlan!.destination,
        States.Idle,
        getDebug().debugTradeMachine
      ),
    },
    [States.DetermineTradeRoute]: {
      invoke: {
        src: async (c) => {
          const tradeRoutes = await determineBestTradeRouteByCurrentLocation(
            c.ship,
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
            c.ship,
            c.ship.location
          );

          if (closest.length) {
            const message = `[${getShip(c.id).name}] Going to closest: ${
              closest[0].route.buyLocation
            }`;
            console.warn(message);
            persistStrategy(
              c.id,
              ShipStrategy.Trade,
              ShipStrategy.GoTo,
              false,
              { location: closest[0].route.buyLocation }
            );
          } else {
            console.warn("No trade routes, switching to probe");
            persistStrategy(
              c.id,
              ShipStrategy.Trade,
              ShipStrategy.Probe,
              false
            );
          }
        },
        onError: { target: States.Done, actions: printErrorAction() },
        onDone: [
          {
            cond: (c, e: any) => !e.data,
            target: States.Done,
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
                (p) => p.good === c.tradeData!.tradeRoute.good
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
};

export const tradeMachine = () =>
  createMachine(debugShipMachineStates(config), options);

function atSellLocationWithSellableGoods(c: Context): boolean {
  const hasLocation = !!c.ship.location;
  const atSellLocation =
    c.tradeData?.tradeRoute.sellLocation === c.ship.location;
  return (
    hasLocation &&
    atSellLocation &&
    getCargoQuantity(c.ship.cargo, c.tradeData!.tradeRoute.good) > 0
  );
}

function atBuyLocationWithTooMuchFuel(c: Context): boolean {
  const hasLocation = !!c.ship.location;
  const hasTradeRoute = !!c.tradeData;
  const isBuyLocation = c.ship.location === c.tradeData?.tradeRoute.buyLocation;
  return (
    hasLocation &&
    hasTradeRoute &&
    isBuyLocation &&
    c.tradeData?.tradeRoute.good !== "FUEL" &&
    getCargoQuantity(c.ship.cargo, "FUEL") > c.tradeData!.tradeRoute.fuelNeeded
  );
}

function atBuyLocationWaitingToBuy(c: Context): boolean {
  const hasTradeRoute = !!c.tradeData;
  const hasLocation = !!c.ship.location;
  const atBuyLocation = c.tradeData?.tradeRoute.buyLocation === c.ship.location;
  return (
    hasTradeRoute &&
    hasLocation &&
    atBuyLocation &&
    getCargoQuantity(c.ship.cargo, c.tradeData!.tradeRoute.good) <
      c.tradeData!.tradeRoute.quantityToBuy
  );
}

function shouldDetermineTradeRoute(c: Context): boolean {
  const hasLocation = !!c.ship.location;
  const hasTradeRoute = !!c.tradeData && c.tradeData.complete !== 1;
  const atSellLocation =
    c.tradeData?.tradeRoute.sellLocation === c.ship.location;
  return hasLocation && (!hasTradeRoute || atSellLocation);
}

function haveExcessCargo(c: Context): boolean {
  const hasTradeRoute = !!c.tradeData;
  const hasLocation = !!c.ship.location;
  const result =
    hasTradeRoute &&
    hasLocation &&
    c.ship.cargo.filter(
      (p) => p.good !== "FUEL" && p.good !== c.tradeData!.tradeRoute.good
    ).length > 0;
  return result;
}

function debugCond(c: Context, cond: (c: Context) => boolean) {
  const result = cond(c);
  if (getDebug().focusShip === c.id) console.log(`${cond.name}: ${result}`);
  return result;
}
