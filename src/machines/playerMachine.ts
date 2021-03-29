import { assign, createMachine } from "xstate";
import { User } from "../api/User";
import { getUser, getToken } from "../api";
import { newPlayerName } from "../newPlayerName";
import { getLoanMachine } from "./getLoanMachine";
import { buyShipMachine } from "./buyShipMachine";
import * as api from "../api";
import { Location } from "../api/Location";
import { ShipActor } from "./Ship/tradeMachine";
import { MarketContext, SystemContext } from "./MarketContext";
import { cacheLocation } from "./locationCache";
import { AvailableShip } from "../api/AvailableShip";
import { calculateNetWorth } from "./calculateNetWorth";
import { NetWorthLineItem } from "./NetWorthLineItem";
import { Ship } from "../api/Ship";
import { FlightPlan } from "../api/FlightPlan";
import { spawnShipMachine } from "./Ship/spawnShipMachine";

export enum States {
  CheckStorage = "checkStorage",
  Idle = "idle",
  Initialising = "initialising",
  GetToken = "getToken",
  GetUser = "getUser",
  GetSystems = "getSystems",
  GetFlightPlans = "getFlightPlans",
  GetShips = "getShips",
  Ready = "ready",
  GetLoan = "getLoan",
  GetAvailableShips = "getAvailableShips",
  BuyShip = "buyShip",
}

export type Schema = {
  value: typeof States[keyof typeof States];
  context: Context;
};

export type Event =
  | { type: "SHIP_UPDATE" }
  | { type: "UPDATE_CREDITS"; data: number }
  | { type: "UPDATE_LOCATION" };

export type Context = {
  token?: string;
  user?: User;
  systems?: SystemContext;
  availableShips: AvailableShip[];
  netWorth: NetWorthLineItem[];
  ships: ShipActor[];
  flightPlans: FlightPlan[];
};

const getCachedPlayer = (): Context => {
  const player = localStorage.getItem("player");
  if (player) return JSON.parse(player);
  else
    return {
      systems: {},
      availableShips: [],
      netWorth: [],
      flightPlans: [],
      ships: [],
    };
};

export const playerMachine = createMachine<Context, Event, Schema>(
  {
    id: "player",
    initial: States.CheckStorage,
    context: {
      systems: {},
      availableShips: [],
      netWorth: [],
      flightPlans: [],
      ships: [],
    } as Context,
    states: {
      [States.CheckStorage]: {
        entry: "assignCachedPlayer",
        always: States.Idle,
      },
      [States.Idle]: {
        entry: [() => console.log("player: idle")],
        always: [
          { target: "getToken", cond: (context) => !context.token },
          { target: "getUser", cond: (context) => !!context.token },
        ],
      },
      [States.Initialising]: {
        always: [
          { target: States.GetSystems, cond: "noLocations" },
          { target: States.GetAvailableShips, cond: "noAvailableShips" },
          { target: States.GetLoan, cond: "noLoans" },
          { target: States.BuyShip, cond: "noPurchasedShips" },
          { target: States.GetFlightPlans, cond: "noShipActors" },
          { target: States.Ready },
        ],
      },
      [States.GetToken]: {
        invoke: {
          src: "getToken",
          onError: States.Idle,
        },
      },
      [States.GetUser]: {
        invoke: {
          src: "getUser",
          onError: {
            target: States.Idle,
          },
          onDone: {
            target: States.Initialising,
            actions: assign<Context, any>({
              user: (c, e) => e.data.user,
            }),
          },
        },
      },
      [States.GetSystems]: {
        entry: (c) => console.log("player: getSystems", c),
        invoke: {
          src: "getSystems",
          onDone: {
            target: States.Initialising,
            actions: assign({
              systems: (c, e: any) => {
                const systems = {} as SystemContext;
                (e.data as api.GetSystemsResponse).systems.forEach((sys) => {
                  const locations = {} as MarketContext;
                  sys.locations.forEach((loc) => (locations[loc.symbol] = loc));
                  return (systems[sys.symbol] = locations);
                });
                return systems;
              },
            }) as any,
          },
        },
      },
      [States.GetFlightPlans]: {
        entry: (c) => console.log("player: getFlightPlans", c),
        invoke: {
          src: (c) => api.getFlightPlans(c.token!, "OE"),
          onDone: {
            target: States.GetShips,
            actions: assign<Context>({
              flightPlans: (c: Context, e: any) => {
                const filtered = (e.data
                  .flightPlans as FlightPlan[]).filter((fp) =>
                  c.user!.ships.find((ship) => ship.id === fp.shipId)
                );
                console.log(filtered);
                return filtered;
              },
            }) as any,
          },
        },
      },
      [States.GetShips]: {
        entry: (c) => console.log("player: getShips", c),
        invoke: {
          src: (c) => api.getShips(c.token!, c.user!.username),
          onDone: {
            target: States.Ready,
            actions: "spawnShips",
          },
        },
      },
      [States.Ready]: {
        entry: ["netWorth", (c) => console.warn("ready", c)],
        after: {
          5000: {
            target: States.BuyShip,
            cond: "shouldBuyShip",
          },
        },
        on: {
          SHIP_UPDATE: {
            actions: ["netWorth"],
          },
          UPDATE_CREDITS: {
            actions: [
              assign<Context>({
                user: (c: Context, e: any) =>
                  ({ ...c.user, credits: e.data } as any),
              }) as any, // why does this type error not appear in vscode?
              "netWorth",
            ],
          },
          UPDATE_LOCATION: {
            actions: assign<Context>({
              systems: (c, e: any) => {
                cacheLocation(e.data);
                const symbol = (e.data as Location).symbol.substr(0, 2);
                c.systems![symbol]![e.data.symbol] = e.data;
                return { ...c.systems };
              },
            }) as any,
          },
        },
      },
      [States.GetLoan]: {
        entry: () => console.warn("getLoan"),
        invoke: {
          src: getLoanMachine,
          data: {
            token: (context: Context) => context.token,
            username: (context: Context) => context.user!.username,
          },
          onDone: {
            target: States.Initialising,
            actions: "assignUser",
          },
        },
      },
      [States.GetAvailableShips]: {
        invoke: {
          src: (context) => api.getAvailableShips(context.token!),
          onDone: {
            target: States.Initialising,
            actions: assign<Context>({
              availableShips: (c: Context, e: any) => e.data.ships,
            }) as any,
          },
        },
      },
      [States.BuyShip]: {
        entry: () => console.warn("Buying ship!"),
        invoke: {
          src: buyShipMachine,
          data: {
            token: (context: Context) => context.token,
            username: (context: Context) => context.user!.username,
            availableShips: (context: Context) => context.availableShips,
          },
          onError: {
            target: "ready",
            actions: (c, e) => console.error(e),
          },
          onDone: {
            target: "ready",
            actions: ["spawnShips", "assignUser"],
          },
        },
      },
    },
  },
  {
    actions: {
      spawnShips: assign<Context>({
        ships: (c, e: any) => {
          const buyShip = e.data.response?.user?.ships;
          const getShip = e.data.ships;
          return (buyShip || getShip)
            .filter(
              (s: Ship) => !c.ships.find((existing) => existing.id === s.id)
            )
            .map(spawnShipMachine(c));
        },
      }) as any,
      assignCachedPlayer: assign<Context>(() => getCachedPlayer()) as any,
      clearPlayer: assign<Context>({
        token: undefined,
        user: undefined,
      }) as any,
      assignUser: assign<Context>({
        user: (c: Context, e: any) => e.data.response.user,
      }) as any,
      netWorth: assign<Context>({
        netWorth: (c: Context) =>
          calculateNetWorth(
            c.user!.credits,
            c.ships.map((a) => a.state?.context).filter((p) => p),
            c.availableShips,
            c.systems!
          ) as any,
      }) as any,
    },
    services: {
      getUser: (c: Context) => getUser(c.token!, c.user!.username),
      getSystems: (c: Context) => api.getSystems(c.token!),
      getToken: async () => {
        const result = await getToken(newPlayerName());
        localStorage.setItem("player", JSON.stringify(result));
      },
    },
    guards: {
      noLoans: (c) => c.user?.loans.length === 0,
      noPurchasedShips: (c) => c.user?.ships.length === 0,
      noLocations: (c) => {
        const hasLocations = Object.entries(c.systems || {}).length > 0;
        console.warn("locations", hasLocations);
        return !hasLocations;
      },
      noAvailableShips: (c) => !c.availableShips.length,
      noShipActors: (c) => !c.ships.length,
      shouldBuyShip: (c) =>
        (c.user?.credits || 0) > 100000 && c.user!.ships.length < 20,
    },
  }
);
