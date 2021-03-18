import { assign, createMachine } from "xstate";
import { User } from "../api/User";
import { apiMachine, ApiResult } from "./apiMachine";
import { GetUserResponse, getUser, getToken } from "../api";
import { newPlayerName } from "../newPlayerName";

type PlayerContext = {
  token?: string;
  user?: User;
};

const getCachedPlayer = (): PlayerContext => {
  const player = localStorage.getItem("player");
  if (player) return JSON.parse(player);
  else return {};
};

export const playerMachine = createMachine(
  {
    id: "player",
    initial: "checkStorage",
    context: {} as PlayerContext,
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
            target: "loaded",
            actions: assign<PlayerContext, any>({
              user: (c, e) => e.data.user,
            }),
          },
        },
      },
      loaded: {
        entry: (c) => console.warn("loaded", c),
        on: {
          CLEAR_PLAYER: "clearPlayer",
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
  }
);
