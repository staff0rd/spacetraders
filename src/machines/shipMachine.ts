import { assign, createMachine, sendParent } from "xstate";
import * as api from "../api";
import { Ship } from "../api/Ship";
import { Location } from "../api/Location";
import { getDistance } from "./getDistance";
import { FlightPlan } from "../api/FlightPlan";
import { DateTime } from "luxon";

type LocationWithDistance = Location & { distance: number };

type Context = {
  token: string;
  username: string;
  ship: Ship;
  location?: Location;
  locations: LocationWithDistance[];
  destination?: string;
  flightPlan?: FlightPlan;
};

const fuelAmountNeeded = (s: Ship) =>
  10 - (s.cargo.find((c) => c.good === "FUEL")?.quantity || 0);

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const shipMachine = createMachine<Context, any, any>(
  {
    id: "buyShip",
    initial: "idle",
    context: {
      token: "",
      username: "",
      ship: {} as Ship,
      locations: [],
    },
    states: {
      idle: {
        entry: (c) => console.log("ship: idle", c),
        always: [
          { target: "inFlight", cond: "hasFlightPlan" },
          { target: "getMarket", cond: "noLocation" },
          { target: "buyFuel", cond: "needFuel" },
          { target: "determineDestination", cond: "noDestination" },
          { target: "createFlightPlan", cond: "noFlightPlan" },
        ],
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
                ship: (c: Context, e) => ({
                  ...c.ship,
                  location: c.flightPlan!.to,
                }),
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
      buyFuel: {
        entry: (c) => console.log("ship: buyFuel", c),
        invoke: {
          src: (context: Context) => {
            const fuelToBuy = fuelAmountNeeded(context.ship);
            return api.purchaseOrder(
              context.token,
              context.username,
              context.ship.id,
              "FUEL",
              fuelToBuy
            );
          },
          onDone: {
            target: "idle",
            actions: [
              assign({ ship: (c, e) => e.data.ship }),
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
      determineDestination: assign({
        destination: (c) => {
          const ordered = c.locations
            .map((lo) => ({
              ...lo,
              distance: getDistance(c.location!.x, c.location!.y, lo.x, lo.y),
            }))
            .sort((a, b) => a.distance - b.distance)
            .filter((p) => p.distance !== 0);
          ordered.forEach((dest) =>
            console.log(
              `${c.location!.symbol} -> ${dest.symbol}: ${dest.distance}`
            )
          );
          return ordered[0].symbol;
        },
      }),
    },
    guards: {
      needFuel: (c) => fuelAmountNeeded(c.ship) > 0,
      noLocation: (c) => !c.location,
      noDestination: (c) => !c.destination,
      noFlightPlan: (c) => !c.flightPlan,
      hasFlightPlan: (c) => !!c.flightPlan,
    },
  }
);
