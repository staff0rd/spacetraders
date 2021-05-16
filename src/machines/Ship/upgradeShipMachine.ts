import {
  ActorRefFrom,
  createMachine,
  EventObject,
  MachineConfig,
  StateMachine,
  assign,
  sendParent,
} from "xstate";
import { getAutomation } from "../../data/localStorage/getAutomation";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import { debugMachineStates } from "../debugStates";
import { UserContext } from "./ShipBaseContext";
import db from "../../data";
import * as api from "../../api";
import {
  clearUpgradingShip,
  getUpgradingShip,
  setUpgradingShip,
} from "../../data/localStorage/getUpgradingShip";
import { IShipStrategy } from "../../data/Strategy/IShipStrategy";
import { persistStrategy } from "../../data/persistStrategy";
import { log } from "xstate/lib/actions";
import { AvailableShip } from "../../api/AvailableShip";
import { buyShipMachine } from "../buyShipMachine";
import { getLocation } from "../../data/localStorage/locationCache";
import { getDistance } from "../getDistance";
import { travelToLocationMachine } from "./travelToLocationMachine";
import { getDebug } from "data/localStorage/getDebug";
import { getCredits } from "data/localStorage/getCredits";
import { printErrorAction } from "./printError";
import { getShip } from "data/localStorage/shipCache";

enum States {
  Started = "started",
  ShouldUpgrade = "shouldUpgrade",
  GetStrategy = "getStrategy",
  BranchOffStrategy = "branchOffStrategy",
  BuyShip = "buyShip",
  SellShip = "sellShip",
  SellShipError = "sellShipError",
  HaltShip = "haltShip",
  Complete = "complete",
  FlyToShipyard = "flyToShipyard",
  Done = "done",
}

export type Context = UserContext & {
  available: AvailableShip[];
  strategy?: IShipStrategy;
  errorCode?: number;
  flyTo?: string;
};

export type Actor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

const shipId = () => getUpgradingShip()!.fromShipId;

const config: MachineConfig<Context, any, any> = {
  id: "upgradeShip",
  initial: States.Started,
  context: {
    token: "",
    username: "",
    available: [],
  },
  states: {
    [States.Started]: {
      after: {
        1: [
          { target: States.ShouldUpgrade, cond: () => !getUpgradingShip() },
          { target: States.GetStrategy },
        ],
      },
    },
    [States.GetStrategy]: {
      invoke: {
        src: (c) => db.strategies.where("shipId").equals(shipId()).first(),
        onDone: {
          target: States.BranchOffStrategy,
          actions: assign<Context>({
            strategy: (c, e: any) => e.data,
          }) as any,
        },
      },
    },
    [States.BranchOffStrategy]: {
      after: {
        1: [
          { cond: (c) => !c.strategy, target: States.BuyShip },
          {
            cond: (c) => c.strategy?.strategy === ShipStrategy.Halt,
            target: States.SellShip,
          },
          {
            cond: (c) => c.strategy?.strategy === ShipStrategy.Change,
            target: States.Done,
          },
          { target: States.HaltShip },
        ],
      },
    },
    [States.HaltShip]: {
      invoke: {
        src: async (c) => {
          const strat = await db.strategies
            .where("shipId")
            .equals(shipId())
            .first();
          await persistStrategy(shipId(), strat!.strategy, ShipStrategy.Halt);
        },
        onDone: States.Done,
      },
    },
    [States.SellShip]: {
      entry: sendParent((c: Context, e) => ({
        type: "STOP_ACTOR",
        data: shipId(),
      })),
      invoke: {
        src: async (c) => {
          console.warn(`Selling ${shipId()}`);
          await api.scrapShip(c.token, c.username, shipId());
        },
        onDone: States.BuyShip,
        onError: {
          target: States.SellShipError,
          actions: [
            assign<Context>({
              errorCode: (c, e: any) => e.data.code,
            }) as any,
            printErrorAction(),
          ],
        },
      },
    },
    [States.SellShipError]: {
      after: {
        1: [
          {
            cond: (c, e: any) => c.errorCode === 42201,
            actions: assign<Context>({ errorCode: undefined }) as any,
            target: States.FlyToShipyard,
          },
          {
            target: States.Done,
            actions: log(),
          },
        ],
      },
    },
    [States.FlyToShipyard]: {
      entry: assign<Context>({
        flyTo: (c) => {
          const ship = getShip(shipId());
          const shipYards = c.available
            .map((av) =>
              av.purchaseLocations.map((lo) => getLocation(lo.location)!)
            )
            .flat()
            .filter((p) => !!p);
          const dist = shipYards
            .map((sy) => ({
              distance: getDistance(sy.x, sy.y, ship!.x, ship!.y),
              location: sy.symbol,
            }))
            .sort((a, b) => a.distance - b.distance);
          const closest = dist[0].location;
          return closest;
        },
      }) as any,
      invoke: {
        src: travelToLocationMachine(getDebug().debugUpgradeMachine),
        data: {
          id: (c: Context) => shipId(),
          token: (c: Context) => c.token,
          username: (c: Context) => c.username,
          ship: (c: Context) => getShip(shipId()),
          destination: (c: Context) => c.flyTo!,
        },
        onDone: States.SellShip,
      },
    },
    [States.BuyShip]: {
      on: {
        BOUGHT_SHIP: {
          actions: sendParent((c: Context, e) => ({
            type: "BOUGHT_SHIP",
            data: {
              response: e.data.response,
              shipNames: e.data.shipNames,
            },
          })),
        },
      },
      invoke: {
        src: buyShipMachine,
        data: {
          token: (c: Context) => c.token,
          username: (c: Context) => c.username,
          availableShips: (c: Context) => c.available,
          shipType: () => getUpgradingShip()!.toShipType,
        },
        onDone: States.Complete,
      },
    },
    [States.Complete]: {
      entry: [() => clearUpgradingShip()],
      after: { 1: States.Done },
    },
    [States.ShouldUpgrade]: {
      invoke: {
        src: async (c) => {
          const { autoUpgrades } = getAutomation();
          for (const upgrade of autoUpgrades.filter((p) => p.on)) {
            const strats = await db.strategies.toArray();
            const ships = await db.ships.toArray();

            const role: ShipStrategy =
              ShipStrategy[upgrade.role as keyof typeof ShipStrategy];
            const haveFrom = ships
              .map((a) => ({
                shipType: a.type,
                shipId: a.id,
                strategy: strats.find((p) => p.shipId === a.id)!,
              }))
              .filter(
                (s) =>
                  s.shipType === upgrade.fromShipType &&
                  s.strategy.strategy === role
              );
            const haveTo = ships.filter((p) => p.type === upgrade.toShipType);
            const shouldUpgrade =
              getCredits() >= upgrade.credits &&
              haveTo.length < upgrade.maxShips &&
              haveFrom.length > 0;
            if (shouldUpgrade) {
              setUpgradingShip(haveFrom[0].shipId, upgrade.toShipType);
            }
          }
        },
        onDone: States.Done,
      },
    },
    [States.Done]: {
      type: "final",
    },
  },
};

export const upgradeShipMachine = createMachine(
  debugMachineStates(config, () => getDebug().debugUpgradeMachine)
);
