import { AvailableShip } from "api/AvailableShip";
import { getAutomation } from "data/localStorage/getAutomation";
import { getDebug } from "data/localStorage/getDebug";
import {
  ActorRefFrom,
  createMachine,
  MachineConfig,
  sendParent,
  StateMachine,
} from "xstate";
import { buyShipMachine } from "./buyShipMachine";
import { debugMachineStates } from "./debugStates";
import { upgradeShipMachine } from "./Ship/upgradeShipMachine";
import { getShips } from "data/localStorage/shipCache";
import { getUpgradingShip } from "data/localStorage/getUpgradingShip";
import { getCredits } from "data/localStorage/getCredits";

export type BuyAndUpgradeActor = ActorRefFrom<StateMachine<Context, any, any>>;

enum States {
  Init = "init",
  Wait = "wait",
  BuyShip = "buyShip",
  UpgradeShip = "upgradeShip",
}

type Context = {
  token: string;
  username: string;
  availableShips: AvailableShip[];
};

const config: MachineConfig<Context, any, any> = {
  initial: States.Init,
  states: {
    [States.Init]: {
      after: {
        1: States.Wait,
      },
    },
    [States.Wait]: {
      after: {
        5000: [
          {
            cond: () => getShips().length === 0 || shouldBuyShip(),
            target: States.BuyShip,
          },
          { target: States.UpgradeShip },
        ],
      },
    },
    [States.UpgradeShip]: {
      invoke: {
        src: (c) =>
          upgradeShipMachine.withContext({
            username: c.username,
            token: c.token,
            available: c.availableShips,
          }),
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
          target: States.Wait,
          actions: (c, e) => console.error(e),
        },
        onDone: {
          target: States.Wait,
          actions: sendParent("SHIP_UPDATE"),
        },
      },
    },
  },
};

export const buyAndUpgradeShipMachine = createMachine(
  debugMachineStates(config, () => getDebug().debugBuyAndUpgradeShipMachine)
);

const shouldBuyShip = () => {
  const { autoBuy } = getAutomation();
  return (
    !getUpgradingShip() &&
    autoBuy.on &&
    getCredits() > autoBuy.credits &&
    getShips().length < autoBuy.maxShips
  );
};
