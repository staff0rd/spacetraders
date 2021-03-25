import { assign, createMachine, spawn } from "xstate";
import { User } from "../api/User";
import { getUser, getToken } from "../api";
import { newPlayerName } from "../newPlayerName";
import { getLoanMachine } from "./getLoanMachine";
import { buyShipMachine } from "./buyShipMachine";
import * as api from "../api";
import { Location } from "../api/Location";
import {
  LocationWithDistance,
  shipMachine,
  ShipActor,
} from "../machines/shipMachine";
import { MarketContext } from "./MarketContext";
import { cacheLocation } from "./locationCache";
import { AvailableShip } from "../api/AvailableShip";
import { calculateNetWorth, LineItem } from "./calculateNetWorth";
import { Ship } from "../api/Ship";
import { FlightPlan } from "../api/FlightPlan";

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
  ClearPlayer = "clearPlayer",
  GetLoan = "getLoan",
  GetAvailableShips = "getAvailableShips",
  BuyShip = "buyShip",
}

export type Schema = {
  value: typeof States[keyof typeof States];
  context: Context;
};

type Event =
  | { type: "CLEAR_PLAYER" }
  | { type: "SHIP_UPDATE" }
  | { type: "UPDATE_CREDITS"; data: number }
  | { type: "UPDATE_LOCATION" };

export type Context = {
  token?: string;
  user?: User;
  locations?: MarketContext;
  availableShips: AvailableShip[];
  netWorth: LineItem[];
  ships: ShipActor[];
  flightPlans: FlightPlan[];
};

const getCachedPlayer = (): Context => {
  const player = localStorage.getItem("player");
  if (player) return JSON.parse(player);
  else
    return {
      locations: {},
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
      locations: {},
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
          onError: [
            {
              //"message": "Token was invalid or missing from the request. Did you confirm sending the token as a query parameter or authorization header?",
              //"code": 40101
              target: States.Idle,
              cond: (c, e) => e.data.code === 40101,
              actions: [
                () => console.warn("Token expired, removing..."),
                "clearPlayer",
              ],
            },
            {
              target: States.Idle,
            },
          ],
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
              locations: (c, e: any) => {
                const locations = {} as MarketContext;
                (e.data.systems[0].locations as Location[]).forEach(
                  (lo) => (locations[lo.symbol] = lo)
                );
                return locations;
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
          CLEAR_PLAYER: States.ClearPlayer,
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
              locations: (c, e: any) => {
                cacheLocation(e.data);
                return { ...c.locations, [e.data.symbol]: e.data };
              },
            }),
          },
        },
      },
      [States.ClearPlayer]: {
        invoke: {
          src: "clearPlayer",
          onDone: {
            target: "checkStorage",
            actions: "clearPlayer",
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
            .map(
              (ship: Ship) =>
                spawn(
                  shipMachine.withContext({
                    token: c.token!,
                    username: c.user!.username,
                    ship: ship,
                    credits: c.user!.credits,
                    locations: Object.keys(c.locations!).map(
                      (symbol) => c.locations![symbol] as LocationWithDistance
                    ),
                    flightPlan: c.flightPlans.find(
                      (fp) => fp.shipId === ship.id
                    ),
                  }),
                  { name: `ship-${ship.id}`, sync: true }
                ) as any
            );
        },
      }),
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
            c.locations!
          ) as any,
      }),
    },
    services: {
      getUser: (c: Context) => getUser(c.token!, c.user!.username),
      getSystems: (c: Context) => api.getSystems(c.token!),
      getToken: async () => {
        const result = await getToken(newPlayerName());
        localStorage.setItem("player", JSON.stringify(result));
      },
      clearPlayer: async () => {
        console.warn("Player cleared");
        localStorage.removeItem("player");
      },
    },
    guards: {
      noLoans: (c) => c.user?.loans.length === 0,
      noPurchasedShips: (c) => c.user?.ships.length === 0,
      noLocations: (c) => {
        const hasLocations = Object.entries(c.locations || {}).length > 0;
        return !hasLocations;
      },
      noAvailableShips: (c) => !c.availableShips.length,
      noShipActors: (c) => !c.ships.length,
      shouldBuyShip: (c) =>
        (c.user?.credits || 0) > 200000 && c.user!.ships.length < 20,
    },
  }
);
