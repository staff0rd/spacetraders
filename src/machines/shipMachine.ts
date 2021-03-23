import {
  ActorRefFrom,
  assign,
  createMachine,
  EventObject,
  sendParent,
  StateMachine,
} from "xstate";
import * as api from "../api";
import { Ship } from "../api/Ship";
import { Location } from "../api/Location";
import { getDistance } from "./getDistance";
import { FlightPlan } from "../api/FlightPlan";
import { DateTime } from "luxon";
import { determineCargo } from "./determineCargo";

export type LocationWithDistance = Location & { distance: number };

export type ShouldBuy = {
  good: string;
  quantity: number;
};

export type Context = {
  token: string;
  username: string;
  ship: Ship;
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

export const shipMachine = createMachine<Context, any, any>(
  {
    id: "ship",
    initial: "idle",
    context: {
      token: "",
      username: "",
      ship: {} as Ship,
      locations: [],
      credits: 0,
    },
    states: {
      idle: {
        after: {
          1: [
            { target: "inFlight", cond: "hasFlightPlan" },
            { target: "getMarket", cond: "noLocation" },
            { target: "sellCargo", cond: "shouldSell" },
            {
              target: "buyGood",
              cond: "needFuel",
              actions: "assignNeededFuel",
            },
            { target: "determineDestination", cond: "noDestination" },
            { target: "determineCargo", cond: "shouldDetermineCargo" },
            { target: "buyGood", cond: "shouldBuyCargo" },
            { target: "createFlightPlan", cond: "noFlightPlan" },
          ],
        },
      },
      sellCargo: {
        invoke: {
          src: async (c) => {
            let lastResult: api.PurchaseOrderResponse = {
              ship: c.ship,
              credits: c.credits,
            };
            const sellableCargo = c.ship.cargo.filter(
              (cargo) => cargo.good !== "FUEL"
            );
            for (const good of sellableCargo) {
              lastResult = await api.sellOrder(
                c.token,
                c.username,
                c.ship.id,
                good.good,
                good.quantity
              );
            }
            return lastResult;
          },
          onDone: {
            target: "idle",
            actions: [
              assign({
                credits: (c, e: any) => e.data.credits,
                ship: (c, e: any) => e.data.ship,
                hasSold: true,
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
            target: "idle",
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
            target: "idle",
            actions: [
              sendParent((c: Context, e) => ({
                type: "SHIP_ARRIVED",
                data: c.ship.id,
              })),
              assign({
                ship: (c: Context, e) => {
                  return {
                    ...c.ship,
                    location: c.flightPlan!.to,
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
        after: { 1: "idle" },
      },
      createFlightPlan: {
        invoke: {
          src: (c) =>
            api.newFlightPlan(c.token, c.username, c.ship.id, c.destination!),
          onDone: {
            target: "inFlight",
            actions: [
              assign({
                flightPlan: (c, e: any) => ({
                  ...e.data.flightPlan,
                  shipId: (e.data.flightPlan as api.NewFlightPlan).ship,
                  createdAt: DateTime.now().toISO(),
                  from: (e.data.flightPlan as api.NewFlightPlan).departure,
                  to: (e.data.flightPlan as api.NewFlightPlan).destination,
                }),
                ship: (c, e: any) => ({
                  ...c.ship,
                  cargo: [
                    ...c.ship.cargo.map((c) =>
                      c.good !== "FUEL"
                        ? c
                        : {
                            ...c,
                            quantity: (e.data.flightPlan as api.NewFlightPlan)
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
            api.getMarket(context.token, context.ship.location!),
          onError: {
            actions: "printError",
          },
          onDone: {
            target: "idle",
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
      buyGood: {
        invoke: {
          src: (context: Context) => {
            return api.purchaseOrder(
              context.token,
              context.username,
              context.ship.id,
              context.shouldBuy!.good,
              context.shouldBuy!.quantity
            );
          },
          onError: {
            //{code: 2004, message: "User has insufficient credits for transaction."},
            //{code: 2006, message: "Good quantity is not available on planet." },
            actions: ["printError", "clearShouldBuy"],
            target: "getMarket",
          },
          onDone: {
            target: "idle",
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
    actions: {
      clearShouldBuy: assign<Context>({ shouldBuy: undefined }),
      printError: (_, e: any) => console.warn("caught an error", e),
      assignNeededFuel: assign({
        shouldBuy: (c) => ({
          good: "FUEL",
          quantity: fuelAmountNeeded(c.ship),
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
      needFuel: (c) => fuelAmountNeeded(c.ship) > 0,
      noLocation: (c) => !c.location,
      noDestination: (c) => !c.destination,
      noFlightPlan: (c) => !c.flightPlan,
      hasFlightPlan: (c) => !!c.flightPlan,
      shouldDetermineCargo: (c) => !c.shouldBuy || c.shouldBuy.good === "FUEL",
      shouldBuyCargo: (c) =>
        c.shouldBuy !== undefined &&
        c.shouldBuy.good !== "NONE" &&
        c.ship.spaceAvailable > 0,
      shouldSell: (c) => !c.hasSold,
    },
  }
);
