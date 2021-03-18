import { assign, createMachine } from "xstate";
import { User } from "../api/User";
import { apiMachine, ApiResult } from "./apiMachine";
import { GetUserResponse, GetTokenResponse } from "../api";

type PlayerContext = {
  token?: string;
  user?: User;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// export const playerMachine = createMachine(
//   {
//     id: "player",
//     initial: "initial",
//     context: { token: "initial" },
//     states: {
//       initial: {
//         entry: () => console.log("initial"),
//         always: {
//           actions: "log",
//           target: "idle",
//         },
//       },
//       idle: {
//         entry: () => console.log("idle"),
//         always: [
//           {
//             target: "getToken",
//             cond: "isInitial",
//           },
//           { target: "loaded", cond: "isNotInitial" },
//         ],
//       },
//       getToken: {
//         entry: () => console.log("getToken"),
//         invoke: {
//           src: "getToken",
//           onDone: {
//             target: "idle",
//             actions: "assignToken",
//           },
//         },
//       },
//       loaded: {
//         type: "final",
//         entry: () => console.log("loaded"),
//       },
//     },
//   },
//   {
//     actions: {
//       // assignToken: () => {
//       //   console.log("assigning");
//       //   assign(() => ({ token: "a thing" }));
//       // },
//       assignToken: assign(() => ({ token: "a thing" })),
//     },
//     services: {
//       getUser: () =>
//         apiMachine(() => Promise.resolve({ user: { username: "ay" } })),
//       getToken: () => {
//         console.log("getToken promise");
//         return Promise.resolve({ token: "from-service" });
//       },
//     },
//     guards: {
//       isInitial: (context: { token: string }) => context.token === "initial",
//       isNotInitial: (context) => context.token !== "initial",
//     },
//   }
// );

/*
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

const getCachedPlayer = (): PlayerContext => {
  const player = localStorage.getItem("player");
  console.log("player", player);
  if (player) return JSON.parse(player);
  else return {};
};

export const playerMachine = createMachine(
  {
    id: "player",
    initial: "idle",
    context: {} as PlayerContext,
    states: {
      checkStorage: {
        entry: ["assignCachedPlayer", () => console.warn("checkStorage")],
        always: "idle",
      },
      idle: {
        entry: ["assignCachedPlayer", () => console.warn("idle")],
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
              assign({ something: (c, e: any) => e.result }),
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
        },
        on: {
          API_RESULT: {
            target: "loaded",
            actions: "assignPlayer",
          },
        },
      },
      loaded: {},
    },
  },
  {
    actions: {
      assignCachedPlayer: assign<PlayerContext>(() => getCachedPlayer()) as any,
      assignPlayer: assign<PlayerContext, ApiResult<GetUserResponse>>({
        user: (c, e) => e.result.user as User,
      }) as any,
    },
    services: {
      getUser: () =>
        apiMachine(() => {
          console.warn("called get user");
          return Promise.resolve({ user: { username: "ay" } });
        }),
      getToken: () =>
        apiMachine(() => {
          console.warn("called getToken");
          return Promise.resolve({ token: "124", username: "hi" });
        }),
      cachePlayer: (async (c: PlayerContext) => {
        console.log("cached player", c);
        localStorage.setItem("player", JSON.stringify((c as any).something));
        await sleep(2000);
      }) as any,
    },
  }
);
