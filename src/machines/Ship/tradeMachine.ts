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
import { debugShipMachine } from "./debugMachine";
import { travelToLocation } from "./travelToLocation";
import { ShipBaseContext } from "./ShipBaseContext";
import { printErrorAction } from "./printError";
import { debugShipMachineStates } from "../debugStates";
import { getCargoQuantity } from "./getCargoQuantity";
import { persistStrategy } from "../../components/Strategy/persistStrategy";
import { IShipDetail } from "../../data/IShipDetail";

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
  Wait = "wait",
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

const config: MachineConfig<Context, any, any> = {
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
          actions: assign<Context>({ tradeRoute: (c, e: any) => e.data }),
          target: States.Idle,
        },
      },
    },
    [States.Idle]: {
      after: {
        1: [
          { target: States.InFlight, cond: (c) => !!c.flightPlan },
          { target: States.GetMarket, cond: "noLocation" },
          {
            target: States.SellCargo,
            cond: (c) =>
              atSellLocationWithSellableGoods(c) ||
              atBuyLocationWithTooMuchFuel(c) ||
              haveExcessCargo(c),
          },
          {
            target: States.ConfirmStrategy,
            cond: (c) => !!c.shouldCheckStrategy,
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
            actions: debugShipMachine("trade", "Nothing left to do"),
          },
        ],
      },
    },
    [States.TravelToLocation]: travelToLocation<Context>(
      (c) => c.tradeRoute!.sellLocation,
      States.Idle
    ),
    [States.DetermineTradeRoute]: {
      invoke: {
        src: async (c) => {
          const tradeRoutes = await determineBestTradeRouteByCurrentLocation(c);
          if (!tradeRoutes.length) {
            console.warn("No trade routes, switching to probe");
            persistStrategy(c.id, ShipStrategy.Trade, ShipStrategy.Probe);
            throw new Error("No trade routes, switching to probe");
          }
          const tradeRoute = tradeRoutes[0];
          db.tradeRoutes.put({
            ...tradeRoute,
            created: DateTime.now().toISO(),
            shipId: c.id,
          });
          return tradeRoute;
        },
        onError: States.Done,
        onDone: {
          target: States.Idle,
          actions: assign<Context>({ tradeRoute: (c, e: any) => e.data }),
        },
      },
    },
    [States.Done]: {
      type: "final",
    },
    [States.SellCargo]: {
      invoke: {
        src: async (c) => {
          let result: Partial<api.PurchaseOrderResponse> = {
            ship: c.ship,
            credits: c.credits,
          };
          const sellableCargo = c.ship!.cargo.filter(
            (cargo) => cargo.good === c.tradeRoute?.good
          );

          const fuelOverage =
            getCargoQuantity(c, "FUEL") - c.tradeRoute!.fuelNeeded;
          if (fuelOverage > 0)
            sellableCargo.push({
              good: "FUEL",
              quantity: fuelOverage,
              totalVolume: fuelOverage,
            });

          if (c.tradeRoute) {
            c.ship!.cargo.filter(
              (p) => p.good !== "FUEL" && p.good !== c.tradeRoute?.good
            ).forEach((cargo) => sellableCargo.push(cargo));
          }
          const runningProfit: number[] = [];
          for (const sellOrder of sellableCargo) {
            const quantity = Math.min(
              MAX_CARGO_MOVE,
              sellOrder.quantity,
              getCargoQuantity(c, sellOrder.good)
            );
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
            const profit = lastBuy
              ? (result!.order!.pricePerUnit -
                  lastBuy.cost / lastBuy.quantity) *
                quantity
              : undefined;
            runningProfit.push(profit || 0);
            db.trades.put({
              cost: result!.order!.total,
              type: TradeType.Sell,
              good: sellOrder.good,
              quantity,
              location: c.location!.symbol,
              shipId: c.id,
              timestamp: DateTime.now().toISO(),
              profit,
            });
          }
          const totalProfit = runningProfit.reduce((a, b) => a + b, 0);
          db.shipDetail
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
      invoke: {
        src: (context: Context) =>
          api.getMarket(context.token, context.ship!.location!),
        onError: {
          actions: printErrorAction(),
          target: States.Done,
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
          let result: Partial<api.PurchaseOrderResponse> = {
            ship: c.ship,
            credits: c.credits,
          };

          do {
            const quantity = Math.min(
              MAX_CARGO_MOVE,
              c.tradeRoute!.quantityToBuy -
                getCargoQuantity(c, c.tradeRoute!.good)
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
        onError: [
          //{code: 2004, message: "User has insufficient credits for transaction."},
          // {
          //   cond: (c, e: any) => e.data.code === 2004,
          //   target: States.Wait,
          // },
          {
            actions: printErrorAction(),
            target: States.Wait,
          },
        ],
        //{code: 2006, message: "Good quantity is not available on planet." },

        //target: States.GetMarket,
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
};

const options: Partial<MachineOptions<Context, any>> = {
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
};

export const tradeMachine = createMachine(
  debugShipMachineStates(config, false),
  options
);

function atSellLocationWithSellableGoods(c: Context): boolean {
  const hasLocation = !!c.ship?.location;
  const atSellLocation = c.tradeRoute?.sellLocation === c.ship?.location;
  return (
    hasLocation && atSellLocation && getCargoQuantity(c, c.tradeRoute!.good) > 0
  );
}

function atBuyLocationWithTooMuchFuel(c: Context): boolean {
  const hasLocation = !!c.ship?.location;
  const hasTradeRoute = !!c.tradeRoute;
  return (
    hasLocation &&
    hasTradeRoute &&
    c.tradeRoute?.good !== "FUEL" &&
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

function haveExcessCargo(c: Context): boolean {
  const hasTradeRoute = !!c.tradeRoute;
  const hasLocation = !!c.ship?.location;
  return (
    hasTradeRoute &&
    hasLocation &&
    c.ship!.cargo.filter(
      (p) => p.good !== "FUEL" && p.good !== c.tradeRoute!.good
    ).length > 0
  );
}
