import { AvailableShip } from "api/AvailableShip";
import { getAutomation } from "data/localStorage/getAutomation";
import { getDebug } from "data/localStorage/getDebug";
import { createMachine, MachineConfig, sendParent } from "xstate";
import { buyShipMachine } from "./buyShipMachine";
import { debugMachineStates } from "./debugStates";
import { upgradeShipMachine } from "./Ship/upgradeShipMachine";
import { getShips } from "data/localStorage/shipCache";
import { getUpgradingShip } from "data/localStorage/getUpgradingShip";
import { getCredits } from "data/localStorage/getCredits";

enum States {
  Idle = "idle",
  BuyShip = "buyShip",
  UpgradeShip = "upgradeShip",
}

type Context = {
  token: string;
  username: string;
  availableShips: AvailableShip[];
};

const config: MachineConfig<Context, any, any> = {
  initial: States.Idle,
  states: {
    [States.Idle]: {
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
          target: States.Idle,
          actions: (c, e) => console.error(e),
        },
        onDone: {
          target: States.Idle,
          actions: sendParent("SHIP_UPDATE"),
        },
      },
    },
  },
};

export const buyAndUpgradeShipmachine = createMachine(
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
