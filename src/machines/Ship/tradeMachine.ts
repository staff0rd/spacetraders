import {
  ActorRefFrom,
  assign,
  createMachine,
  EventObject,
  sendParent,
  StateMachine,
} from "xstate";
import * as api from "../../api";
import { Cargo, Ship } from "../../api/Ship";
import { Location } from "../../api/Location";
import { getDistance } from "../getDistance";
import { FlightPlan } from "../../api/FlightPlan";
import { DateTime } from "luxon";
import { determineCargo, MAX_CARGO_MOVE } from "../determineCargo";
import db from "../../data";
import { TradeType } from "../../data/ITrade";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import { ShipBaseContext } from "./ShipBaseContext";
import { updateStrategy } from "./updateStrategy";

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
  CheckStrategy = "checkStrategy",
  UpdateStrategy = "updateStrategy",
  Done = "done",
}

export type Context = ShipBaseContext & {
  location?: Location;
  locations: LocationWithDistance[];
  destination?: string;
  shouldBuy?: ShouldBuy;
  flightPlan?: FlightPlan;
  credits: number;
  hasSold?: boolean;
};

export type ShipActor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

const fuelAmountNeeded = (s: Ship) =>
  10 - (s.cargo.find((c) => c.good === "FUEL")?.quantity || 0);

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
      locations: [],
      credits: 0,
      strategy: { strategy: ShipStrategy.Trade },
    },
    states: {
      [States.Init]: {
        invoke: {
          src: (c) => api.getShip(c.token, c.username, c.id),
          onDone: {
            target: States.Idle,
            actions: assign<Context>({ ship: (c, e: any) => e.data.ship }),
          },
        },
      },
      [States.Idle]: {
        after: {
          1: [
            { target: "inFlight", cond: "hasFlightPlan" },
            { target: "getMarket", cond: "noLocation" },
            { target: States.SellCargo, cond: "shouldSell" },
            { target: States.CheckStrategy, cond: "shouldCheckStrategy" },
            { target: States.UpdateStrategy, cond: "shouldDone" },
            {
              target: States.BuyCargo,
              cond: "needFuel",
              actions: "assignNeededFuel",
            },
            { target: "determineDestination", cond: "noDestination" },
            { target: "determineCargo", cond: "shouldDetermineCargo" },
            { target: States.BuyCargo, cond: "shouldBuyCargo" },
            { target: "createFlightPlan", cond: "noFlightPlan" },
          ],
        },
      },
      [States.Done]: {
        type: "final",
      },
      [States.UpdateStrategy]: {
        invoke: {
          src: updateStrategy,
          onDone: {
            target: States.Done,
          },
        },
      },
      [States.CheckStrategy]: {
        invoke: {
          src: "checkStrategy",
          onDone: {
            target: States.Idle,
            actions: "checkStrategy",
          },
        },
      },
      [States.SellCargo]: {
        invoke: {
          src: async (c) => {
            let result: Partial<api.PurchaseOrderResponse> = {
              ship: c.ship,
              credits: c.credits,
            };
            const sellableCargo = c.ship!.cargo.filter(
              (cargo) => cargo.good !== "FUEL"
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
            actions: "printError",
            target: States.Idle,
          },
          onDone: {
            target: States.Idle,
            actions: [
              assign({
                credits: (c, e: any) => e.data.credits,
                ship: (c, e: any) => e.data.ship,
                hasSold: (c, e: any) =>
                  e.data.ship.cargo.filter((p: Cargo) => p.good !== "FUEL")
                    .length === 0,
                shouldCheckStrategy: true,
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
      determineCargo: {
        invoke: {
          src: determineCargo,
          onDone: {
            target: States.Idle,
            actions: assign({ shouldBuy: (c, e: any) => e.data }),
          },
        },
      },
      inFlight: {
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
                destination: undefined,
                flightPlan: undefined,
                location: undefined,
                hasSold: false,
              }) as any,
            ],
          },
        },
      },
      determineDestination: {
        entry: ["determineDestination"],
        after: { 1: States.Idle },
      },
      createFlightPlan: {
        invoke: {
          src: (c) =>
            api.newFlightPlan(c.token, c.username, c.id, c.destination!),
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
      getMarket: {
        invoke: {
          src: (context: Context) =>
            api.getMarket(context.token, context.ship!.location!),
          onError: {
            actions: "printError",
            target: States.Idle,
          },
          onDone: {
            target: States.Idle,
            actions: [
              assign({
                location: (c, e: any) =>
                  (e.data as api.GetMarketResponse).location,
                hasSold: false,
              }) as any,
              sendParent((c, e: any) => ({
                type: "UPDATE_LOCATION",
                data: (e.data as api.GetMarketResponse).location,
              })),
            ],
          },
        },
      },
      [States.BuyCargo]: {
        invoke: {
          src: async (context: Context) => {
            const { good, quantity, profit, sellTo } = context.shouldBuy!;
            const result = await api.purchaseOrder(
              context.token,
              context.username,
              context.id,
              good,
              quantity
            );
            db.trades.put({
              cost: result.order.total,
              type: TradeType.Buy,
              good,
              quantity,
              location: sellTo,
              shipId: context.id,
              timestamp: DateTime.now().toISO(),
              profit,
            });
            return result;
          },
          onError: {
            //{code: 2004, message: "User has insufficient credits for transaction."},
            //{code: 2006, message: "Good quantity is not available on planet." },
            actions: ["printError", "clearShouldBuy"],
            target: "getMarket",
          },
          onDone: {
            target: States.Idle,
            actions: [
              assign({
                ship: (c, e: any) => e.data.ship,
                credits: (c, e: any) => e.data.credits,
              }) as any,
              "clearShouldBuy",
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
    services: {
      checkStrategy: async (c) => {
        const strategy = await db.strategies.where({ shipId: c.id }).first();
        return strategy;
      },
    },
    actions: {
      checkStrategy: assign<Context>({
        strategy: (c, e: any) => e.data,
        shouldCheckStrategy: false,
      }),
      clearShouldBuy: assign<Context>({ shouldBuy: undefined }),
      printError: (_, e: any) => console.warn("caught an error", e),
      assignNeededFuel: assign({
        shouldBuy: (c) => ({
          good: "FUEL",
          quantity: fuelAmountNeeded(c.ship!),
          profit: 0,
        }),
      }),
      shipUpdate: sendParent((c: Context) => ({
        type: "SHIP_UPDATE",
        data: c.ship,
      })),
      determineDestination: assign({
        destination: (c) => {
          const locationsByDistance = c.locations
            .map((lo) => ({
              ...lo,
              distance: getDistance(c.location!.x, c.location!.y, lo.x, lo.y),
            }))
            .sort((a, b) => a.distance - b.distance)
            .filter((p) => p.distance !== 0);

          return locationsByDistance[0].symbol;
        },
      }),
    },
    guards: {
      needFuel: (c) => fuelAmountNeeded(c.ship!) > 0,
      noLocation: (c) => !c.location,
      noDestination: (c) => !c.destination,
      noFlightPlan: (c) => !c.flightPlan,
      hasFlightPlan: (c) => !!c.flightPlan,
      shouldDetermineCargo: (c) => !c.shouldBuy || c.shouldBuy.good === "FUEL",
      shouldBuyCargo: (c) =>
        c.shouldBuy !== undefined &&
        c.shouldBuy.good !== "NONE" &&
        c.ship!.spaceAvailable > 0,
      shouldSell: (c) => !c.hasSold,
      shouldDone: (c) => c.strategy.strategy !== ShipStrategy.Trade,
      shouldCheckStrategy: (c) => !!c.shouldCheckStrategy,
    },
  }
);
