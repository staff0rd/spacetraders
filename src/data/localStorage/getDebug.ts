import { Keys } from "./Keys";
import { IDebug } from "./IDebug";

export const getDebug = (): IDebug => {
  const value = localStorage.getItem(Keys.Debug);
  if (value) {
    const parsed: IDebug = JSON.parse(value);
    return parsed;
  } else
    return {
      debugPlayerMachine: false,
      debugProbeMachine: false,
      debugTradeMachine: false,
      debugUpgradeMachine: false,
      debugHaltMachine: false,
    };
};

export const setDebug = (debug: Partial<IDebug>) => {
  const value = {
    ...getDebug(),
    ...debug,
  };
  localStorage.setItem(Keys.Debug, JSON.stringify(value));
};
