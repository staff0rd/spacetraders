import { assign, createMachine, sendParent } from "xstate";
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
};

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
        entry: (c) => console.log("ship: idle", c),
        after: {
          1: [
            { target: "inFlight", cond: "hasFlightPlan" },
            { target: "getMarket", cond: "noLocation" },
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
      buyCargo: {
        entry: (c) => console.log("ship: buyCargo"),
      },
      determineCargo: {
        entry: (c) => console.log("ship: determineCargo", c),
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
                  console.log("setting ship location to ", c.flightPlan);
                  return {
                    ...c.ship,
                    location: c.flightPlan!.to,
                  };
                },
                destination: undefined,
                flightPlan: undefined,
                location: undefined,
              }) as any,
            ],
          },
        },
      },
      determineDestination: {
        entry: [
          (c) => console.log("ship: determineDestination", c),
          "determineDestination",
        ],
        always: "idle",
      },
      createFlightPlan: {
        entry: (c) => console.log("ship: createFlightPlan", c),
        invoke: {
          src: (c) =>
            api.newFlightPlan(c.token, c.username, c.ship.id, c.destination!),
          onDone: {
            target: "inFlight",
            actions: [
              assign({ flightPlan: (c, e: any) => e.data.flightPlan }),
              sendParent((c, e: any) => ({
                type: "NEW_FLIGHTPLAN",
                data: e.data.flightPlan,
              })),
            ],
          },
        },
      },
      getMarket: {
        entry: (c) => console.log("ship: getMarket", c),
        invoke: {
          src: (context: Context) =>
            api.getMarket(context.token, context.ship.location),
          onDone: {
            target: "idle",
            actions: [
              () => console.log("getMarket done"),
              assign({
                location: (c, e: any) =>
                  (e.data as api.GetMarketResponse).location,
              }),
              sendParent((c, e: any) => ({
                type: "UPDATE_LOCATION",
                data: (e.data as api.GetMarketResponse).location,
              })),
            ],
          },
        },
      },
      buyGood: {
        entry: (c) => console.log("ship: buyGood", c),
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
          onDone: {
            target: "idle",
            actions: [
              assign({
                ship: (c, e) => e.data.ship,
                credits: (c, e) => e.data.credits,
              }),
              sendParent((context, event) => ({
                type: "UPDATE_CREDITS",
                data: event.data.credits,
              })),
            ],
          },
        },
      },
    },
  },
  {
    actions: {
      assignNeededFuel: assign({
        shouldBuy: (c) => ({
          good: "FUEL",
          quantity: fuelAmountNeeded(c.ship),
        }),
      }),
      determineDestination: assign({
        destination: (c) => {
          const locationsByDistance = c.locations
            .map((lo) => ({
              ...lo,
              distance: getDistance(c.location!.x, c.location!.y, lo.x, lo.y),
            }))
            .sort((a, b) => a.distance - b.distance)
            .filter((p) => p.distance !== 0);
          locationsByDistance.forEach((dest) =>
            console.log(
              `${c.location!.symbol} -> ${dest.symbol}: ${dest.distance}`
            )
          );
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
    },
  }
);
