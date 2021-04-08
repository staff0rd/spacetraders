import {
  ActorRefFrom,
  createMachine,
  EventObject,
  MachineConfig,
  StateMachine,
} from "xstate";
import { getAutomation } from "../../data/IAutomation";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import { debugMachineStates } from "../debugStates";
import { UserContext } from "./ShipBaseContext";
import db from "../../data";

enum States {
  ShouldUpgrade = "shouldUpgrade",
  Done = "done",
}

export type Context = UserContext & {
  credits: number;
};

export type Actor = ActorRefFrom<StateMachine<Context, any, EventObject>>;

const config: MachineConfig<Context, any, any> = {
  id: "upgradeShip",
  initial: States.ShouldUpgrade,
  context: {
    token: "",
    username: "",
    credits: 0,
  },
  states: {
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
              c.credits >= upgrade.credits &&
              haveTo.length < upgrade.maxShips &&
              haveFrom.length > 0;
            console.log(`Should upgrade: ${shouldUpgrade}`);
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
  debugMachineStates(config, true)
);
