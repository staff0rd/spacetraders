import { assign, createMachine } from "xstate";
import { User } from "../api/User";
import { apiMachine, ApiResult } from "./apiMachine";
import { GetUserResponse, getUser, getToken } from "../api";
import { newPlayerName } from "../newPlayerName";
import { getLoanMachine } from "./getLoanMachine";
import { buyShipMachine } from "./buyShipMachine";
import * as api from "../api";
import { Location } from "../api/Location";
import { shipMachine } from "../machines/shipMachine";
import { FlightPlan } from "../api/FlightPlan";
import { DateTime } from "luxon";
import { MarketContext } from "./MarketContext";
import { cacheLocation } from "./locationCache";

type PlayerContext = {
  token?: string;
  user?: User;
  locations?: MarketContext;
  flightPlans?: FlightPlan[];
};

const getCachedPlayer = (): PlayerContext => {
  const player = localStorage.getItem("player");
  if (player) return JSON.parse(player);
  else return { locations: {} };
};

export const playerMachine = createMachine(
  {
    id: "player",
    initial: "checkStorage",
    context: {
      locations: {},
    } as PlayerContext,
    states: {
      checkStorage: {
        entry: ["assignCachedPlayer"],
        always: "idle",
      },
      idle: {
        entry: [() => console.warn("idle")],
        always: [
          { target: "getToken", cond: (context) => !context.token },
          { target: "getUser", cond: (context) => !!context.token },
        ],
      },
      initialising: {
        always: [
          { target: "getSystems", cond: "noLocations" },
          { target: "getLoan", cond: "noLoans" },
          { target: "getFlightPlans", cond: "noFlightPlans" },
          { target: "buyShip", cond: "noShips" },
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
            actions: assign<PlayerContext, any>({
              user: (c, e) => e.data.user,
            }),
          },
        },
      },
      getSystems: {
        entry: (c) => console.warn("getSystems", c),
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
        entry: (c) => console.warn("getFlightPlans", c),
        invoke: {
          src: (c) => api.getFlightPlans(c.token!, "OE"),
          onDone: {
            target: "initialising",
            actions: assign({
              flightPlans: (c: PlayerContext, e: any) => {
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
        entry: (c) => console.warn("ready", c),
        on: {
          CLEAR_PLAYER: "clearPlayer",
          NEW_FLIGHTPLAN: {
            actions: assign({
              flightPlans: (c: PlayerContext, e: any) => [
                ...c.flightPlans!,
                {
                  ...e.data,
                  shipId: e.data.ship,
                  createdAt: DateTime.now().toISO(),
                  from: e.data.departure,
                  to: e.data.destination,
                },
              ],
            }) as any,
          },
          SHIP_ARRIVED: {
            actions: assign({
              flightPlans: (c: PlayerContext, e: any) => [
                ...c.flightPlans!.filter((p) => p.shipId !== e.data),
              ],
            }) as any,
          },
          UPDATE_CREDITS: {
            actions: assign<PlayerContext>({
              user: (c: PlayerContext, e: any) =>
                ({ ...c.user, credits: e.data } as any),
            }),
          },
          UPDATE_LOCATION: {
            actions: assign<PlayerContext>({
              locations: (c, e: any) => {
                cacheLocation(e.data);
                return { ...c.locations, [e.data.symbol]: e.data };
              },
            }),
          },
        },
        invoke: {
          id: "ship",
          src: shipMachine,
          data: {
            token: (context: PlayerContext) => context.token,
            username: (context: PlayerContext) => context.user!.username,
            ship: (context: PlayerContext) => context.user!.ships[0],
            credits: (context: PlayerContext) => context.user!.credits,
            locations: (context: PlayerContext) =>
              Object.keys(context.locations!).map(
                (symbol) => context.locations![symbol]
              ),
            flightPlan: (context: PlayerContext) =>
              context.flightPlans?.find(
                (fp) => fp.shipId === context.user!.ships[0].id
              ),
          },
          onDone: {
            actions: () => console.log("ship machine done"),
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
            token: (context: PlayerContext) => context.token,
            username: (context: PlayerContext) => context.user!.username,
          },
          onDone: {
            target: "initialising",
            actions: "assignUser",
          },
        },
      },
      buyShip: {
        entry: () => console.warn("buyShip"),
        invoke: {
          src: buyShipMachine,
          data: {
            token: (context: PlayerContext) => context.token,
            username: (context: PlayerContext) => context.user!.username,
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
      assignCachedPlayer: assign<PlayerContext>(() => getCachedPlayer()) as any,
      assignPlayer: assign<PlayerContext, ApiResult<GetUserResponse>>({
        user: (c, e) => e.result.user as User,
      }) as any,
      clearPlayer: assign<PlayerContext>({
        token: undefined,
        user: undefined,
      }) as any,
      assignUser: assign<PlayerContext>({
        user: (c: PlayerContext, e: any) => e.data.response.user,
      }) as any,
    },
    services: {
      getUser: (c: PlayerContext) => getUser(c.token!, c.user!.username),
      getSystems: (c: PlayerContext) => api.getSystems(c.token!),
      getToken: () => apiMachine(() => getToken(newPlayerName())),
      cachePlayer: async (c: PlayerContext) => {
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
        console.log(c.locations);
        return !hasLocations;
      },
      noFlightPlans: (c) => !c.flightPlans,
    },
  }
);
