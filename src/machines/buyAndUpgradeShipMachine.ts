import { AvailableShip } from "api/AvailableShip";
import { getAutomation } from "data/localStorage/getAutomation";
import { getDebug } from "data/localStorage/getDebug";
import {
  ActorRefFrom,
  createMachine,
  MachineConfig,
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
  id: "buyAndUpgrade",
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
          { cond: () => !!getUpgradingShip(), target: States.UpgradeShip },
          { target: States.Wait },
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
            shipId: getUpgradingShip()!.fromShipId,
          }),
        onDone: States.Wait,
        onError: States.Wait,
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
