import {
  ActorRefFrom,
  assign,
  createMachine,
  EventObject,
  sendParent,
  StateMachine,
} from "xstate";
import * as api from "../../api";
import { Ship } from "../../api/Ship";
import { Location } from "../../api/Location";
import { FlightPlan } from "../../api/FlightPlan";
import { DateTime } from "luxon";
import db from "../../data";
import { TradeType } from "../../data/ITrade";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import { confirmStrategy } from "./confirmStrategy";
import { initShipMachine } from "./initShipMachine";
import { determineBestTradeRouteByCurrentLocation } from "./determineBestTradeRoute";
import { TradeRoute } from "./TradeRoute";
import { debug } from "./debug";
import { travelToLocation } from "./travelToLocation";
import { ShipBaseContext } from "./ShipBaseContext";
import { printErrorAction } from "./printError";

const MAX_CARGO_MOVE = 300;

export type LocationWithDistance = Location & { distance: number };

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
  InFlight = "inFlight",
  GetMarket = "getMarket",
  GetTradeRoute = "getTradeRoute",
  TravelToLocation = "travelToLocation",
}

export type Context = ShipBaseContext & {
  location?: Location;
  locations: LocationWithDistance[];
  credits: number;
  tradeRoute?: TradeRoute;
};

export type ShipActor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const tradeMachine = createMachine<Context, any, any>(
  {
    id: "ship",
    initial: States.Init,
    context: {
      id: "",
      token: "",
      username: "",
      ship: {} as Ship,
      shipName: "",
      locations: [],
      credits: 0,
      strategy: { strategy: ShipStrategy.Trade },
    },
    states: {
      [States.Init]: initShipMachine<Context>("trade", States.GetTradeRoute),
      [States.GetTradeRoute]: {
        entry: debug("trade"),
        invoke: {
          src: async (c) => {
            const route = await db.tradeRoutes
              .where("shipId")
              .equals(c.id)
              .reverse();
            return route.first();
          },
          onDone: {
            actions: assign<Context>({ tradeRoute: (c, e: any) => e.data }),
            target: States.ConfirmStrategy,
          },
        },
      },
      [States.Idle]: {
        entry: debug("trade"),
        after: {
          1: [
            { target: States.InFlight, cond: (c) => !!c.flightPlan },
            { target: States.GetMarket, cond: "noLocation" },
            {
              target: States.SellCargo,
              cond: (c) =>
                atSellLocationWithSellableGoods(c) ||
                atBuyLocationWithTooMuchFuel(c),
            },
            {
              target: States.DetermineTradeRoute,
              cond: (c) =>
                !!c.ship?.location &&
                (!c.tradeRoute ||
                  c.tradeRoute?.sellLocation === c.ship?.location),
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
              actions: debug("trade", "Nothing left to do"),
            },
          ],
        },
      },
      [States.TravelToLocation]: travelToLocation(
        (c) => c.tradeRoute!.sellLocation,
        States.Idle
      ),
      [States.DetermineTradeRoute]: {
        entry: debug("trade"),
        invoke: {
          src: async (c) =>
            (await determineBestTradeRouteByCurrentLocation(c))[0],
          onDone: {
            target: States.Idle,
            actions: assign<Context>({ tradeRoute: (c, e: any) => e.data }),
          },
        },
      },
      [States.Done]: {
        entry: debug("trade"),
        type: "final",
      },
      [States.SellCargo]: {
        entry: debug("trade"),
        invoke: {
          src: async (c) => {
            let result: Partial<api.PurchaseOrderResponse> = {
              ship: c.ship,
              credits: c.credits,
            };
            const sellableCargo = c.ship!.cargo.filter(
              (cargo) => cargo.good === c.tradeRoute?.good
            );
            for (const sellOrder of sellableCargo) {
              const quantity = Math.min(MAX_CARGO_MOVE, sellOrder.quantity);
              result = await api.sellOrder(
                c.token,
                c.username,
                c.id,
                sellOrder.good,
                quantity
              );
              const lastBuy = await db.trades
                .reverse()
                .filter(
                  (p) =>
                    p.good === sellOrder.good &&
                    p.shipId === c.id &&
                    p.type === TradeType.Buy
                )
                .last();
              db.trades.put({
                cost: result!.order!.total,
                type: TradeType.Sell,
                good: sellOrder.good,
                quantity,
                location: c.location!.symbol,
                shipId: c.id,
                timestamp: DateTime.now().toISO(),
                profit: lastBuy
                  ? (result!.order!.pricePerUnit -
                      lastBuy.cost / lastBuy.quantity) *
                    quantity
                  : undefined,
              });
            }
            return result;
          },
          onError: {
            actions: printErrorAction,
            target: States.Idle,
          },
          onDone: {
            target: States.ConfirmStrategy,
            actions: [
              assign({
                credits: (c, e: any) => e.data.credits,
                ship: (c, e: any) => e.data.ship,
              }) as any,
              "shipUpdate",
              sendParent((context, event) => ({
                type: "UPDATE_CREDITS",
                data: event.data.credits,
              })),
            ],
          },
        },
      },
      [States.InFlight]: {
        entry: debug("trade"),
        invoke: {
          src: async (c) => {
            await sleep(
              DateTime.fromISO(c.flightPlan!.arrivesAt).diffNow("seconds")
                .seconds * 1000
            );
          },
          onDone: {
            target: States.Idle,
            actions: [
              sendParent((c: Context, e) => ({
                type: "SHIP_ARRIVED",
                data: c.id,
              })),
              assign({
                ship: (c: Context, e) => {
                  return {
                    ...c.ship!,
                    location: c.flightPlan!.destination,
                  };
                },
                flightPlan: undefined,
                location: undefined,
              }) as any,
            ],
          },
        },
      },
      createFlightPlan: {
        entry: debug("trade"),
        invoke: {
          src: (c) =>
            api.newFlightPlan(
              c.token,
              c.username,
              c.id,
              c.tradeRoute!.sellLocation
            ),
          onDone: {
            target: "inFlight",
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
              "shipUpdate",
              sendParent((c, e: any) => ({
                type: "NEW_FLIGHTPLAN",
                data: c.flightPlan,
              })),
            ],
          },
        },
      },
      [States.GetMarket]: {
        entry: debug("trade"),
        invoke: {
          src: (context: Context) =>
            api.getMarket(context.token, context.ship!.location!),
          onError: {
            actions: printErrorAction,
            target: States.Idle,
          },
          onDone: {
            target: States.Idle,
            actions: [
              assign({
                location: (c, e: any) =>
                  (e.data as api.GetMarketResponse).location,
              }) as any,
              sendParent((c, e: any) => ({
                type: "UPDATE_LOCATION",
                data: (e.data as api.GetMarketResponse).location,
              })),
            ],
          },
        },
      },
      [States.ConfirmStrategy]: confirmStrategy(
        ShipStrategy.Trade,
        States.Idle,
        States.Done
      ),
      [States.BuyCargo]: {
        entry: debug("trade"),
        invoke: {
          src: async (c: Context) => {
            let result: Partial<api.PurchaseOrderResponse> = {
              ship: c.ship,
              credits: c.credits,
            };

            do {
              const quantity = Math.min(
                MAX_CARGO_MOVE,
                c.tradeRoute!.quantityToBuy
              );
              result = await api.purchaseOrder(
                c.token,
                c.username,
                c.id,
                c.tradeRoute!.good,
                quantity,
                c.tradeRoute!.buyLocation,
                c.tradeRoute!.profitPerUnit * quantity
              );
            } while (
              result.ship!.cargo.find((g) => g.good === c.tradeRoute!.good)!
                .quantity < c.tradeRoute!.quantityToBuy
            );

            return result;
          },
          onError: {
            //{code: 2004, message: "User has insufficient credits for transaction."},
            //{code: 2006, message: "Good quantity is not available on planet." },
            actions: printErrorAction,
            target: States.GetMarket,
          },
          onDone: {
            target: States.Idle,
            actions: [
              assign({
                ship: (c, e: any) => e.data.ship,
                credits: (c, e: any) => e.data.credits,
              }) as any,
              sendParent((context, event) => ({
                type: "UPDATE_CREDITS",
                data: event.data.credits,
              })),
              "shipUpdate",
            ],
          },
        },
      },
    },
  },
  {
    actions: {
      shipUpdate: sendParent((c: Context) => ({
        type: "SHIP_UPDATE",
        data: c.ship,
      })),
    },
    guards: {
      noLocation: (c) => !c.location,
      shouldDone: (c) => c.strategy.strategy !== ShipStrategy.Trade,
    },
  }
);
function atSellLocationWithSellableGoods(c: Context): boolean {
  const hasLocation = !!c.ship?.location;
  const atSellLocation = c.tradeRoute?.sellLocation === c.ship?.location;
  return (
    hasLocation && atSellLocation && getCargoQuantity(c, c.tradeRoute!.good) > 0
  );
}

function getCargoQuantity(c: Context, good: string): number {
  return c.ship?.cargo.find((o) => o.good === good)?.quantity || 0;
}

function atBuyLocationWithTooMuchFuel(c: Context): boolean {
  const hasLocation = !!c.ship?.location;
  const hasTradeRoute = !!c.tradeRoute;
  return (
    hasLocation &&
    hasTradeRoute &&
    getCargoQuantity(c, "FUEL") > c.tradeRoute!.fuelNeeded
  );
}

function atBuyLocationWaitingToBuy(c: Context): boolean {
  const hasTradeRoute = !!c.tradeRoute;
  const hasLocation = !!c.ship?.location;
  const atBuyLocation = c.tradeRoute?.buyLocation === c.ship?.location;
  return (
    hasTradeRoute &&
    hasLocation &&
    atBuyLocation &&
    getCargoQuantity(c, c.tradeRoute!.good) < c.tradeRoute!.quantityToBuy
  );
}
