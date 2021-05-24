import * as xstate from "xstate";
import * as shipCache from "data/localStorage/shipCache";
import * as getCredits from "data/localStorage/getCredits";
import * as config from "machines/config";
import * as automation from "data/localStorage/getAutomation";

export const waitForMachine = (
  machine: any,
  desiredState: string
): Promise<
  xstate.Interpreter<
    Record<string, any> | undefined,
    any,
    xstate.EventObject,
    {
      value: any;
      context: Record<string, any> | undefined;
    }
  >
> =>
  new Promise((res, rej) => {
    const interpreter = xstate.interpret(machine);
    interpreter["sendTo"] = jest.fn();
    const service = interpreter.onTransition((state) => {
      if (state.matches(desiredState)) {
        res(service);
      }
    });
    service.start();
  });

export const mockGetters = ({
  credits = 10000000,
  tickDelay = 5,
  ships = [],
}: {
  credits?: number;
  tickDelay?: number;
  ships?: shipCache.CachedShip[];
} = {}) => {
  jest.spyOn(getCredits, "getCredits").mockReturnValue(credits);
  jest.spyOn(getCredits, "setCredits").mockImplementation();
  jest.spyOn(config, "getTickDelay").mockReturnValue(tickDelay);
  jest.spyOn(shipCache, "load").mockImplementation();
  jest.spyOn(shipCache, "getShips").mockReturnValue(ships);
  jest.spyOn(shipCache, "saveShip").mockImplementation();
  jest.spyOn(shipCache, "saveDetail").mockImplementation();
  jest.spyOn(automation, "getAutomation").mockReturnValue({
    autoBuy: {
      credits: 10000,
      maxShips: 2,
      on: false,
      shipType: "JW-MK-I",
    },
    autoUpgrades: [],
  });
};
