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

type MarketContext = {
  [key: string]: Location;
};

type PlayerContext = {
  token?: string;
  user?: User;
  locations: MarketContext;
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
        entry: ["assignCachedPlayer", (c) => console.warn("checkStorage", c)],
        always: "idle",
      },
      idle: {
        entry: [() => console.warn("idle")],
        always: [
          { target: "getToken", cond: (context) => !context.token },
          { target: "getUser", cond: (context) => !!context.token },
        ],
      },
      getToken: {
        entry: () => console.warn("getToken"),
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
      initialising: {
        entry: (c) => console.warn("initialising", c),
        always: [
          { target: "getLoan", cond: "noLoans" },
          { target: "buyShip", cond: "noShips" },
          { target: "getMarket", cond: "shipWithNoMarket" },
          { target: "ready" },
        ],
      },
      ready: {
        entry: (c) => console.warn("ready", c),
        on: {
          CLEAR_PLAYER: "clearPlayer",
          UPDATE_CREDITS: {
            actions: assign<PlayerContext>({
              user: (c: PlayerContext, e: any) =>
                ({ ...c.user, credits: e.data } as any),
            }),
          },
        },
        invoke: {
          src: shipMachine,
          data: {
            token: (context: PlayerContext) => context.token,
            username: (context: PlayerContext) => context.user!.username,
            ship: (context: PlayerContext) => context.user!.ships[0],
          },
          onDone: {
            actions: () => console.log("ship machine done"),
          },
        },
      },
      getMarket: {
        entry: (c) => console.warn("getMarket", c),
        invoke: {
          src: (context: PlayerContext) =>
            api.getMarket(context.token!, context.user!.ships![0].location),
          onDone: {
            target: "initialising",
            actions: assign<PlayerContext>({
              locations: (c: PlayerContext, e: any) => {
                const { location } = e.data as api.GetMarketResponse;
                return {
                  ...c.locations,
                  [location.symbol]: location,
                };
              },
            }) as any,
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
      shipWithNoMarket: (c) =>
        c.locations[c.user!.ships![0].location] === undefined,
    },
  }
);
