import {
  assign,
  createMachine,
  MachineConfig,
  MachineOptions,
  spawn,
} from "xstate";
import { User } from "../api/User";
import { getUser, getToken } from "../api";
import { newPlayerName } from "../data/names";
import { getLoanMachine } from "./getLoanMachine";
import * as api from "../api";
import { ShipActor } from "./Ship/tradeMachine";
import { MarketContext, SystemContext } from "./MarketContext";
import { AvailableShip } from "../api/AvailableShip";
import { calculateNetWorth } from "./calculateNetWorth";
import { NetWorthLineItem } from "./NetWorthLineItem";
import { FlightPlan } from "../api/FlightPlan";
import { spawnShipMachine } from "./Ship/spawnShipMachine";
import { getLocalUser } from "../data/localStorage/getLocalUser";
import { IAutomation } from "../data/localStorage/IAutomation";
import { getDebug } from "../data/localStorage/getDebug";
import { getShips } from "data/localStorage/shipCache";
import { CachedShip } from "data/localStorage/CachedShip";
import {
  SystemMonitorActor,
  systemMonitorMachine,
  getFlightPlans,
} from "./systemMonitorMachine";
import {
  BuyAndUpgradeActor,
  buyAndUpgradeShipMachine,
} from "./buyAndUpgradeShipMachine";
import { IShipOrder, ShipOrders } from "data/IShipOrder";
import { debugMachineStates } from "./debugStates";
import { getTickDelay } from "./config";
import { getSystemFromLocationSymbol } from "data/localStorage/getSystemFromLocationSymbol";

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
  SpawnShips = "spawnShips",
  Ready = "ready",
  GetLoan = "getLoan",
  GetStartupData = "getStartupData",
  SpawnBuyAndUpgradeActor = "spawnBuyAndUpgradeActor",
  SpawnSystemMonitorActor = "spawnSystemMonitorActor",
}

export type Schema = {
  value: typeof States[keyof typeof States];
  context: Context;
};

export type Event =
  | { type: "SHIP_UPDATE" }
  | { type: "STOP_ACTOR"; data: string };

export type Context = {
  token?: string;
  username?: string;
  user?: User;
  systems?: SystemContext;
  availableShips: AvailableShip[];
  netWorth: NetWorthLineItem[];
  actors: ShipActor[];
  flightPlans: FlightPlan[];
  shipOrders?: IShipOrder[];
  resetDetected?: boolean;
  automation: IAutomation;
  ships?: CachedShip[];
  buyAndUpgradeActor?: BuyAndUpgradeActor;
  systemMonitorActor?: SystemMonitorActor;
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
    STOP_ACTOR: {
      actions: (c, e: any) => {
        const actor = c.actors.find((a) => a.state!.context.id === e.data);
        if (actor !== undefined && actor.stop) actor.stop();
      },
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
          { target: States.GetSystems, cond: "noLocations" },
          { target: States.GetStartupData, cond: "noAvailableShips" },
          { target: States.GetLoan, cond: "noLoans" },
          { target: States.GetFlightPlans, cond: "noShipActors" },
          { target: States.Ready },
        ],
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
          { actions: (c, e) => console.error(e.data) },
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
        (c) => {
          const doneActors = c.actors.filter((a) => a?.state.value === "done");
          doneActors.forEach((a) => {
            a.stop && a.stop(); // TODO: Is this required?
          });
        },
      ],
      exit: [
        assign<Context>({
          actors: (c, e) => {
            const actorsNotDone = c.actors.filter(
              (a) => a?.state.value !== "done"
            );
            return actorsNotDone;
          },
        }) as any,
      ],
      after: {
        1: [{ target: States.SpawnShips }],
      },
    },
    [States.GetFlightPlans]: {
      invoke: {
        src: (c) => api.getFlightPlans(c.token!, c.username!, "OE"),
        onDone: {
          target: States.SpawnShips,
          actions: assign<Context>({
            flightPlans: (c: Context, e: any) => {
              const ships = getShips();
              const filtered = (e.data.flightPlans as FlightPlan[]).filter(
                (fp) => ships.find((s) => s.id === fp.shipId)
              );
              return filtered;
            },
          }) as any,
        },
        onError: [
          {
            cond: (c, e) => e.data.code === 42201,
            actions: (c, e) => console.warn(e.data.message),
            target: States.SpawnShips,
          },
        ],
      },
    },
    [States.SpawnShips]: {
      entry: ["spawnShips"],
      after: {
        1: {
          target: [States.Ready],
        },
      },
    },
    [States.SpawnBuyAndUpgradeActor]: {
      entry: [
        assign<Context>({
          buyAndUpgradeActor: (c) =>
            spawn(
              buyAndUpgradeShipMachine.withContext({
                token: c.token!,
                username: c.username!,
                availableShips: c.availableShips,
              })
            ),
        }),
      ],
      after: {
        1: States.Ready,
      },
    },
    [States.Ready]: {
      entry: "netWorth",
      after: [
        {
          delay: 1,
          target: States.SpawnBuyAndUpgradeActor,
          cond: (c) =>
            !c.buyAndUpgradeActor || !!c.buyAndUpgradeActor.state.done,
        },
        {
          delay: 1,
          target: States.SpawnSystemMonitorActor,
          cond: (c) =>
            !c.systemMonitorActor || !!c.systemMonitorActor.state.done,
        },
        {
          delay: () => getTickDelay(),
          target: States.Tick,
        },
      ],
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
          actions: assign<Context>({
            user: (c, e: any) => ({
              ...c.user!,
              loans: [...(c.user?.loans || []), e.data.response.loan],
            }),
          }) as any,
        },
      },
    },
    [States.SpawnSystemMonitorActor]: {
      entry: assign({
        systemMonitorActor: (c) =>
          spawn(
            systemMonitorMachine.withContext({
              token: c.token!,
              username: c.username!,
            })
          ),
      }),
      after: { 1: States.Ready },
    },
    [States.GetStartupData]: {
      invoke: {
        src: async (context) => {
          await api.getShips(context.token!, context.username!);
          await api.getAvailableStructures(context.token!);
          await getFlightPlans(context.token!, context.username!);
          return api.getAvailableShips(context.token!);
        },
        onDone: {
          target: States.Initialising,
          actions: assign<Context>({
            availableShips: (c: Context, e: any) => e.data.ships,
            ships: () => getShips(),
          }) as any,
        },
      },
    },
  },
};

const options: Partial<MachineOptions<Context, Event>> = {
  actions: {
    getSystemFlightPlans: (c) => {
      console.warn("Getting system flight plans");
      const ships = getShips();
      [
        ...new Set(
          ships
            .filter((p) => p.location)
            .map((p) => getSystemFromLocationSymbol(p.location!.symbol))
        ),
      ].map((system) => api.getFlightPlans(c.token!, c.username!, system));
    },
    spawnShips: assign<Context>({
      actors: (c, e: any) => {
        const alreadySpawnedShipIds = c.actors.map(
          (actor) => actor?.state.context.id
        );

        const toSpawn: CachedShip[] = getShips().filter((s: CachedShip) => {
          const alreadySpawned = alreadySpawnedShipIds.find(
            (id) => id === s.id
          );
          if (alreadySpawned) {
            return false;
          }
          return true;
        });
        type GroupByStrat = { order: ShipOrders; count: number };
        if (toSpawn.length) {
          toSpawn
            .reduce((prev: GroupByStrat[], cur) => {
              if (cur.orders.length) {
                if (!prev.find((p) => p.order === cur.orders[0].order)) {
                  prev.push({ order: cur.orders[0].order, count: 0 });
                }
                prev.find((p) => p.order === cur.orders[0].order)!.count += 1;
              } else {
                throw new Error(`${cur.name} has no orders`);
              }
              return prev;
            }, [])
            .forEach((s) =>
              console.warn(
                `Spawning ${s.count} x ${ShipOrders[s.order]} machines`
              )
            );
        }

        return [
          ...c.actors,
          ...toSpawn.map((s) => spawnShipMachine(c)(s)),
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
        calculateNetWorth(c.availableShips, c.systems!) as any,
    }) as any,
  },
  services: {
    getUser: (c: Context) => getUser(c.token!, c.username!),
    getSystems: (c: Context) => api.getSystems(c.token!),
    getToken: async () => getToken(newPlayerName()),
  },
  guards: {
    noLoans: (c) => c.user?.loans.length === 0,
    noPurchasedShips: (c) => getShips().length === 0,
    noLocations: (c) => {
      const hasLocations = Object.entries(c.systems || {}).length > 0;
      return !hasLocations;
    },
    noAvailableShips: (c) => !c.availableShips.length,
    noShipActors: (c) => !c.actors.length,
  },
};

export const playerMachine = createMachine(
  debugMachineStates(config, () => getDebug().debugPlayerMachine),
  options
);
