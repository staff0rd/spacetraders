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
import { cacheLocation } from "../data/localStorage/locationCache";
import { AvailableShip } from "../api/AvailableShip";
import { calculateNetWorth } from "./calculateNetWorth";
import { NetWorthLineItem } from "./NetWorthLineItem";
import { Ship } from "../api/Ship";
import { FlightPlan } from "../api/FlightPlan";
import { getStrategy, spawnShipMachine } from "./Ship/spawnShipMachine";
import db from "../data";
import { IShipStrategy } from "../data/Strategy/IShipStrategy";
import { debugMachineStates } from "./debugStates";
import { IShipDetail } from "../data/IShipDetail";
import { getLocalUser } from "../data/localStorage/getLocalUser";
import { getAutomation, IAutomation } from "../data/localStorage/IAutomation";
import { log } from "xstate/lib/actions";
import { upgradeShipMachine } from "./Ship/upgradeShipMachine";
import { getUpgradingShip } from "../data/localStorage/IUpgradeShip";
import { BoughtShipEvent } from "./BoughtShipEvent";
import { getDebug } from "../data/localStorage/IDebug";
import { getCredits } from "data/localStorage/getCredits";
import { ShipStrategy } from "data/Strategy/ShipStrategy";
import { ChangeStrategyPayload } from "data/Strategy/StrategyPayloads";

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
  | { type: "STOP_ACTOR"; data: string }
  | BoughtShipEvent
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
  shipNames?: IShipDetail[];
  resetDetected?: boolean;
  automation: IAutomation;
};

export const initialContext = {
  systems: {},
  availableShips: [],
  netWorth: [],
  flightPlans: [],
  actors: [],
  automation: {} as IAutomation,
} as Context;

const config: MachineConfig<Context, any, Event> = {
  id: "player",
  initial: States.CheckStorage,
  context: initialContext,
  on: {
    SHIP_UPDATE: {
      actions: ["netWorth"],
    },
    STOP_ACTOR: {
      actions: (c, e: any) => {
        const actor = c.actors.find((a) => a.state!.context.id === e.data);
        if (actor !== undefined && actor.stop) actor.stop();
      },
    },
    BOUGHT_SHIP: {
      actions: assign<Context, BoughtShipEvent>({
        user: (c, e) => e.data.response.user,
        ships: (c, e) => e.data.response.user.ships,
        shipNames: (c, e) => e.data.shipNames,
      }) as any,
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
  states: {
    [States.CheckStorage]: {
      entry: assign<Context>({
        token: getLocalUser()?.token,
        username: getLocalUser()?.username,
      }) as any,
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
        src: async () => db.shipDetail.toArray(),
        onDone: {
          target: States.Initialising,
          actions: assign<Context>({ shipNames: (c, e: any) => e.data }) as any,
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
          }) as any,
        },
      },
    },
    [States.GetUser]: {
      invoke: {
        src: "getUser",
        onError: [
          {
            cond: (c, e: any) => e.data.code === 40101,
            actions: assign<Context>({ resetDetected: true }) as any,
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
      invoke: {
        src: (c: Context) =>
          upgradeShipMachine.withContext({
            username: c.username!,
            token: c.token!,
            available: c.availableShips,
            shipNames: c.shipNames || [],
            ships: c.ships!,
          }),
        onDone: States.GetStrategies,
        onError: {
          actions: log(undefined, "error"),
          target: States.GetStrategies,
        },
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
          shipType: () => getAutomation().autoBuy.shipType,
        },
        onError: {
          target: States.Ready,
          actions: (c, e) => console.error(e),
        },
        onDone: States.GetStrategies,
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

        const debug = getDebug();
        const toSpawn: { ship: Ship; strategy: ShipStrategy }[] = c
          .ships!.filter((s: Ship) => {
            const alreadySpawned = alreadySpawnedShipIds.find(
              (id) => id === s.id
            );
            if (alreadySpawned) {
              return false;
            }
            return true;
          })
          .filter((p) => !debug.focusShip || p.id === debug.focusShip)
          .map((ts) => {
            const strat = getStrategy(c, ts);
            const strategy =
              strat.strategy === ShipStrategy.Change
                ? (strat.data as ChangeStrategyPayload).from.strategy
                : strat.strategy;
            return { ship: ts, strategy };
          });
        type GroupByStrat = { strategy: ShipStrategy; count: number };
        if (toSpawn.length) {
          toSpawn
            .reduce((prev: GroupByStrat[], cur) => {
              if (!prev.find((p) => p.strategy === cur.strategy)) {
                prev.push({ strategy: cur.strategy, count: 0 });
              }
              prev.find((p) => p.strategy === cur.strategy)!.count += 1;
              return prev;
            }, [])
            .forEach((s) =>
              console.warn(
                `Spawning ${s.count} x ${ShipStrategy[s.strategy]} machines`
              )
            );
        }

        return [
          ...c.actors,
          ...toSpawn.map((s) => spawnShipMachine(c)(s.ship, s.strategy)),
        ] as any;
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
    shouldBuyShip: (c) => {
      const { autoBuy } = getAutomation();
      return (
        !getUpgradingShip() &&
        autoBuy.on &&
        getCredits() > autoBuy.credits &&
        c.user!.ships.length < autoBuy.maxShips
      );
    },
  },
};

export const playerMachine = createMachine(
  debugMachineStates(config, getDebug().debugPlayerMachine),
  options
);
