import { assign, createMachine, spawn } from "xstate";
import { User } from "../api/User";
import { apiMachine, ApiResult } from "./apiMachine";
import { GetUserResponse, getUser, getToken } from "../api";
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
import { FlightPlan } from "../api/FlightPlan";
import { MarketContext } from "./MarketContext";
import { cacheLocation } from "./locationCache";
import { Ship } from "../api/Ship";
import { AvailableShip } from "../api/AvailableShip";
import { calculateNetWorth, LineItem } from "./calculateNetWorth";

type Context = {
  token?: string;
  user?: User;
  locations?: MarketContext;
  flightPlans?: FlightPlan[];
  availableShips: AvailableShip[];
  ships: Ship[];
  netWorth: LineItem[];
  ship_actors: ShipActor[];
};

const getCachedPlayer = (): Context => {
  const player = localStorage.getItem("player");
  if (player) return JSON.parse(player);
  else
    return {
      locations: {},
      ships: [],
      availableShips: [],
      netWorth: [],
      ship_actors: [],
    };
};

export const playerMachine = createMachine(
  {
    id: "player",
    initial: "checkStorage",
    context: {
      locations: {},
      ships: [],
      availableShips: [],
      netWorth: [],
      ship_actors: [],
    } as Context,
    states: {
      checkStorage: {
        entry: ["assignCachedPlayer"],
        always: "idle",
      },
      idle: {
        entry: [() => console.log("player: idle")],
        always: [
          { target: "getToken", cond: (context) => !context.token },
          { target: "getUser", cond: (context) => !!context.token },
        ],
      },
      initialising: {
        always: [
          { target: "getSystems", cond: "noLocations" },
          { target: "getAvailableShips", cond: "noAvailableShips" },
          { target: "getLoan", cond: "noLoans" },
          { target: "buyShip", cond: "noShips" },
          { target: "getFlightPlans", cond: "noFlightPlans" },
          { target: "ready" },
        ],
      },
      getToken: {
        invoke: {
          src: "getToken",
          onError: "idle",
        },
        on: {
          API_RESULT: {
            target: "cachePlayer",
            actions: [
              assign({ apiResult: (c, e: any) => e.result }),
              (c: any) => console.log("after cache", c),
            ],
          } as any,
        },
      },
      cachePlayer: {
        invoke: {
          src: "cachePlayer",
          onDone: "checkStorage",
        },
      },
      getUser: {
        invoke: {
          src: "getUser",
          onError: "idle",
          onDone: {
            target: "initialising",
            actions: assign<Context, any>({
              user: (c, e) => e.data.user,
              ships: (c, e) => e.data.user.ships,
            }),
          },
        },
      },
      getSystems: {
        entry: (c) => console.log("player: getSystems", c),
        invoke: {
          src: "getSystems",
          onDone: {
            target: "initialising",
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
      getFlightPlans: {
        entry: (c) => console.log("player: getFlightPlans", c),
        invoke: {
          src: (c) => api.getFlightPlans(c.token!, "OE"),
          onDone: {
            target: "initialising",
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
      ready: {
        entry: [
          "netWorth",
          (c) => console.warn("ready", c),
          assign<Context>({
            ship_actors: (c) => [
              ...c.ship_actors,
              spawn(
                shipMachine.withContext({
                  token: c.token!,
                  username: c.user!.username,
                  ship: c.user!.ships[0],
                  credits: c.user!.credits,
                  locations: Object.keys(c.locations!).map(
                    (symbol) => c.locations![symbol] as LocationWithDistance
                  ),
                  flightPlan: c.flightPlans?.find(
                    (fp) => fp.shipId === c.user!.ships[0].id
                  ),
                }),
                { name: `ship-${c.ships[0].id}`, sync: true }
              ) as any,
            ],
          }),
        ],
        on: {
          CLEAR_PLAYER: "clearPlayer",
          NEW_FLIGHTPLAN: {
            actions: [
              assign<Context>({
                flightPlans: (c: Context, e: any) => [
                  ...c.flightPlans!,
                  e.data,
                ],
              }) as any,
              "netWorth",
            ],
          },
          SHIP_UPDATE: {
            actions: [
              assign<Context>({
                ships: (c, e: any) => {
                  console.log("SHIP_UPDATE", e.data, c);
                  const result = [
                    ...c.ships.filter((ship) => ship.id !== e.data.id),
                    e.data,
                  ];
                  return result;
                },
              }) as any,
              "netWorth",
            ],
          },
          SHIP_ARRIVED: {
            actions: [
              assign<Context>({
                flightPlans: (c: Context, e: any) => [
                  ...c.flightPlans!.filter((p) => p.shipId !== e.data),
                ],
              }) as any,
              "netWorth",
            ],
          },
          UPDATE_CREDITS: {
            actions: [
              assign<Context>({
                user: (c: Context, e: any) =>
                  ({ ...c.user, credits: e.data } as any),
              }),
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
      clearPlayer: {
        invoke: {
          src: "clearPlayer",
          onDone: {
            target: "checkStorage",
            actions: "clearPlayer",
          },
        },
      },
      getLoan: {
        entry: () => console.warn("getLoan"),
        invoke: {
          src: getLoanMachine,
          data: {
            token: (context: Context) => context.token,
            username: (context: Context) => context.user!.username,
          },
          onDone: {
            target: "initialising",
            actions: "assignUser",
          },
        },
      },
      getAvailableShips: {
        invoke: {
          src: (context) => api.getAvailableShips(context.token!),
          onDone: {
            target: "initialising",
            actions: assign<Context>({
              availableShips: (c: Context, e: any) => e.data.ships,
            }) as any,
          },
        },
      },
      buyShip: {
        entry: () => console.warn("buyShip"),
        invoke: {
          src: buyShipMachine,
          data: {
            token: (context: Context) => context.token,
            username: (context: Context) => context.user!.username,
            availableShips: (context: Context) => context.availableShips,
          },
          onDone: {
            target: "initialising",
            actions: "assignUser",
          },
        },
      },
    },
  },
  {
    actions: {
      assignCachedPlayer: assign<Context>(() => getCachedPlayer()) as any,
      assignPlayer: assign<Context, ApiResult<GetUserResponse>>({
        user: (c, e) => e.result.user as User,
      }) as any,
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
            c.ships,
            c.availableShips,
            c.locations!,
            c.flightPlans!
          ) as any,
      }),
    },
    services: {
      getUser: (c: Context) => getUser(c.token!, c.user!.username),
      getSystems: (c: Context) => api.getSystems(c.token!),
      getToken: () => apiMachine(() => getToken(newPlayerName())),
      cachePlayer: async (c: Context) => {
        console.log("cached player", c);
        localStorage.setItem("player", JSON.stringify((c as any).apiResult));
      },
      clearPlayer: async () => {
        console.warn("Player cleared");
        localStorage.removeItem("player");
      },
    },
    guards: {
      noLoans: (c) => c.user?.loans.length === 0,
      noShips: (c) => c.user?.ships.length === 0,
      noLocations: (c) => {
        const hasLocations = Object.entries(c.locations || {}).length > 0;
        return !hasLocations;
      },
      noFlightPlans: (c) => !c.flightPlans,
      noAvailableShips: (c) => !c.availableShips.length,
    },
  }
);
