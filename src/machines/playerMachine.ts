import { assign, createMachine, MachineConfig, MachineOptions } from "xstate";
import { User } from "../api/User";
import { getUser, getToken } from "../api";
import { newPlayerName } from "../data/names";
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
import db from "../data";
import { IShipStrategy } from "../data/Strategy/IShipStrategy";
import { debugMachineStates } from "./debugStates";
import { IShip } from "../data/IShip";
import { getLocalUser } from "../data/getLocalUser";

const BUY_MAX_SHIPS = 80;

export enum States {
  CheckStorage = "checkStorage",
  Idle = "idle",
  Initialising = "initialising",
  GetToken = "getToken",
  GetUser = "getUser",
  GetSystems = "getSystems",
  GetFlightPlans = "getFlightPlans",
  Tick = "tick",
  GetShips = "getShips",
  GetStrategies = "getStrategies",
  SpawnShips = "spawnShips",
  Ready = "ready",
  GetLoan = "getLoan",
  GetAvailableShips = "getAvailableShips",
  BuyShip = "buyShip",
  GetShipNames = "getShipNames",
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
  username?: string;
  user?: User;
  systems?: SystemContext;
  availableShips: AvailableShip[];
  netWorth: NetWorthLineItem[];
  actors: ShipActor[];
  flightPlans: FlightPlan[];
  strategies?: IShipStrategy[];
  ships?: Ship[];
  shipNames?: IShip[];
  resetDetected?: boolean;
};

const config: MachineConfig<Context, any, Event> = {
  id: "player",
  initial: States.CheckStorage,
  context: {
    systems: {},
    availableShips: [],
    netWorth: [],
    flightPlans: [],
    actors: [],
  } as Context,
  states: {
    [States.CheckStorage]: {
      entry: assign<Context>({
        token: getLocalUser()?.token,
        username: getLocalUser()?.username,
      }),
      after: { 1: States.Idle },
    },
    [States.Idle]: {
      after: {
        1: [
          { target: States.GetToken, cond: (context) => !context.token },
          { target: States.GetUser, cond: (context) => !!context.token },
        ],
      },
    },
    [States.Initialising]: {
      after: {
        1: [
          { target: States.GetShipNames, cond: (c) => !c.shipNames },
          { target: States.GetSystems, cond: "noLocations" },
          { target: States.GetAvailableShips, cond: "noAvailableShips" },
          { target: States.GetLoan, cond: "noLoans" },
          { target: States.BuyShip, cond: "noPurchasedShips" },
          { target: States.GetFlightPlans, cond: "noShipActors" },
          { target: States.Ready },
        ],
      },
    },
    [States.GetShipNames]: {
      invoke: {
        src: async () => db.shipNames.toArray(),
        onDone: {
          target: States.Initialising,
          actions: assign<Context>({ shipNames: (c, e: any) => e.data }),
        },
      },
    },
    [States.GetToken]: {
      invoke: {
        src: "getToken",
        onDone: {
          target: States.Idle,
          actions: assign<Context>({
            token: () => getLocalUser()?.token,
            username: () => getLocalUser()?.username,
          }),
        },
      },
    },
    [States.GetUser]: {
      invoke: {
        src: "getUser",
        onError: [
          {
            cond: (c, e: any) => e.data.code === 40101,
            actions: assign<Context>({ resetDetected: true }),
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
    [States.Tick]: {
      entry: [
        (c) => api.getFlightPlans(c.token!, c.username!, "OE") as any,
        (c) => {
          const doneActors = c.actors.filter((a) => a.state.value === "done");

          doneActors.forEach((a) => {
            a.stop && a.stop(); // TODO: Is this required?
          });
        },
      ],
      exit: assign<Context>({
        actors: (c, e) => {
          const actorsNotDone = c.actors.filter(
            (a) => a.state.value !== "done"
          );
          return actorsNotDone;
        },
      }) as any,
      after: {
        1: { target: States.GetStrategies },
      },
    },
    [States.GetFlightPlans]: {
      invoke: {
        src: (c) => api.getFlightPlans(c.token!, c.username!, "OE"),
        onDone: {
          target: States.GetShips,
          actions: assign<Context>({
            flightPlans: (c: Context, e: any) => {
              const filtered = (e.data
                .flightPlans as FlightPlan[]).filter((fp) =>
                c.user!.ships.find((ship) => ship.id === fp.shipId)
              );
              return filtered;
            },
          }) as any,
        },
      },
    },
    [States.GetStrategies]: {
      invoke: {
        src: () => db.strategies.toArray(),
        onDone: {
          actions: assign<Context>({
            strategies: (c, e: any) => e.data,
          }) as any,
          target: States.SpawnShips,
        },
      },
    },
    [States.SpawnShips]: {
      exit: ["spawnShips"],
      after: {
        1: {
          target: [States.Ready],
        },
      },
    },
    [States.GetShips]: {
      invoke: {
        src: (c) => api.getShips(c.token!, c.username!),
        onDone: {
          target: States.GetStrategies,
          actions: assign<Context>({
            ships: (c, e: any) => (e.data as api.GetShipsResponse).ships,
          }) as any,
        },
      },
    },
    [States.Ready]: {
      entry: "netWorth",
      after: {
        5000: {
          target: States.BuyShip,
          cond: "shouldBuyShip",
        },
        10000: {
          target: States.Tick,
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
      invoke: {
        src: getLoanMachine,
        data: {
          token: (context: Context) => context.token,
          username: (context: Context) => context.username,
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
      invoke: {
        src: buyShipMachine,
        data: {
          token: (context: Context) => context.token,
          username: (context: Context) => context.username,
          availableShips: (context: Context) => context.availableShips,
        },
        onError: {
          target: States.Ready,
          actions: (c, e) => console.error(e),
        },
        onDone: {
          target: States.GetStrategies,
          actions: [
            "assignUser",
            assign<Context>({
              ships: (c, e: any) =>
                (e.data.response as api.GetUserResponse).user.ships,
              shipNames: (c, e: any) => e.data.shipNames,
            }),
          ],
        },
      },
    },
  },
};

const options: Partial<MachineOptions<Context, Event>> = {
  actions: {
    spawnShips: assign<Context>({
      actors: (c, e: any) => {
        const alreadySpawnedShipIds = c.actors.map(
          (actor) => actor.state.context.id
        );

        const toSpawn: Ship[] = c.ships!.filter((s: Ship) => {
          const alreadySpawned = alreadySpawnedShipIds.find(
            (id) => id === s.id
          );
          if (alreadySpawned) {
            return false;
          }
          return true;
        });

        if (toSpawn.length) console.warn(`Spawning ${toSpawn.length} actor(s)`);

        return [...c.actors, ...toSpawn.map(spawnShipMachine(c))] as any;
      },
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
          c.actors.map((a) => a.state?.context).filter((p) => p),
          c.availableShips,
          c.systems!
        ) as any,
    }) as any,
  },
  services: {
    getUser: (c: Context) => getUser(c.token!, c.username!),
    getSystems: (c: Context) => api.getSystems(c.token!),
    getToken: async () => getToken(newPlayerName()),
  },
  guards: {
    noLoans: (c) => c.user?.loans.length === 0,
    noPurchasedShips: (c) => c.user?.ships.length === 0,
    noLocations: (c) => {
      const hasLocations = Object.entries(c.systems || {}).length > 0;
      return !hasLocations;
    },
    noAvailableShips: (c) => !c.availableShips.length,
    noShipActors: (c) => !c.actors.length,
    shouldBuyShip: (c) =>
      (c.user?.credits || 0) > 100000 && c.user!.ships.length < BUY_MAX_SHIPS,
  },
};

export const playerMachine = createMachine(
  debugMachineStates(config, false),
  options
);
