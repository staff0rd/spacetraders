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
import { debugMachineStates } from "../debugStates";
import { UserContext } from "./ShipBaseContext";

import * as api from "../../api";
import {
  clearUpgradingShip,
  getUpgradingShip,
  setUpgradingShip,
} from "../../data/localStorage/getUpgradingShip";
import { log } from "xstate/lib/actions";
import { AvailableShip } from "../../api/AvailableShip";
import { buyShipMachine } from "../buyShipMachine";
import { getLocation } from "../../data/localStorage/locationCache";
import { getDistance } from "../getDistance";
import { travelToLocationMachine } from "./travelToLocationMachine";
import { getDebug } from "data/localStorage/getDebug";
import { getCredits } from "data/localStorage/getCredits";
import { printErrorAction } from "./printError";
import {
  getOrderLabel,
  getShip,
  getShips,
  newOrder,
} from "data/localStorage/shipCache";
import { ShipOrders } from "data/IShipOrder";

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
  errorCode?: number;
  flyTo?: string;
  shipId: string;
};

export type Actor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

const config: MachineConfig<Context, any, any> = {
  id: "upgradeShip",
  initial: States.Started,
  states: {
    [States.Started]: {
      after: {
        1: [
          { target: States.ShouldUpgrade, cond: () => !getUpgradingShip() },
          { target: States.GetStrategy },
        ],
      },
    },
    [States.BranchOffStrategy]: {
      after: {
        1: [
          { cond: (c) => !getShip(c.shipId), target: States.BuyShip },
          {
            cond: (c) =>
              getOrderLabel(getShip(c.shipId).orders) === ShipOrders.Halt,
            target: States.SellShip,
          },
          { target: States.HaltShip },
        ],
      },
    },
    [States.HaltShip]: {
      entry: (c) => newOrder(c.shipId, ShipOrders.Halt, "Upgrading ship"),
      after: {
        1: States.Done,
      },
    },
    [States.SellShip]: {
      entry: sendParent((c: Context, e) => ({
        type: "STOP_ACTOR",
        data: c.shipId,
      })),
      invoke: {
        src: async (c) => {
          console.warn(`Selling ${c.shipId}`);
          await api.scrapShip(c.token, c.username, c.shipId);
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
          const ship = getShip(c.shipId);
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
          id: (c: Context) => c.shipId,
          token: (c: Context) => c.token,
          username: (c: Context) => c.username,
          ship: (c: Context) => getShip(c.shipId),
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
            const ships = getShips();

            const role: ShipOrders =
              ShipOrders[upgrade.role as keyof typeof ShipOrders];
            const currentSourceShips = ships.filter(
              (ship) =>
                ship.type === upgrade.fromShipType &&
                ship.orders.length === 1 &&
                ship.orders[0].order === role
            );
            const currentTargetShips = ships.filter(
              (p) => p.type === upgrade.toShipType
            );
            const shouldUpgrade =
              getCredits() >= upgrade.credits &&
              currentTargetShips.length < upgrade.maxShips &&
              currentSourceShips.length > 0;
            if (shouldUpgrade) {
              setUpgradingShip(currentSourceShips[0].id, upgrade.toShipType);
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
