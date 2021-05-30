import * as xstate from "xstate";
import * as shipCache from "data/localStorage/shipCache";
import * as getCredits from "data/localStorage/getCredits";
import * as config from "machines/config";
import * as automation from "data/localStorage/getAutomation";
import * as determineTradeRoutes from "machines/Ship/determineBestTradeRoute";
import { TradeRoute } from "machines/Ship/TradeRoute";
import { createTradeRoute } from "./objectMother";
import { DateTime } from "luxon";
import { CachedShip } from "data/localStorage/CachedShip";

export const waitForMachine = (
  machine: any,
  desiredState: string,
  debug = false
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
      if (debug) {
        const time = DateTime.local().toISOTime();
        const shipName = state.context?.id
          ? shipCache.getShip(state.context?.id)?.name
          : "";

        console.log(
          `[${time}] (${shipName})/(${state.context?.testId}) ${state.value}`
        );
      }
      if (state.matches(desiredState)) {
        service.stop();
        res(service);
      }
    });
    service.start();
  });

export const mockGetters = ({
  credits = 10000000,
  tickDelay = 5,
  ships = [],
  bestTradeRoutes = [createTradeRoute()],
}: {
  credits?: number;
  tickDelay?: number;
  ships?: CachedShip[];
  bestTradeRoutes?: TradeRoute[];
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
  jest
    .spyOn(determineTradeRoutes, "determineBestTradeRouteByCurrentLocation")
    .mockResolvedValue(bestTradeRoutes);
};