import { Keys } from "./Keys";
import { IDebug } from "./IDebug";

const debug: IDebug = JSON.parse(localStorage.getItem(Keys.Debug)!) || {
  debugPlayerMachine: false,
  debugProbeMachine: false,
  debugTradeMachine: false,
  debugUpgradeMachine: false,
  debugHaltMachine: false,
};

export const getDebug = (): IDebug => {
  return debug;
};

export const setDebug = (updated: Partial<IDebug>) => {
  Object.keys(updated)
    .filter((k) => k)
    .forEach(
      // @ts-ignore
      (key) => (debug[key as keyof IDebug] = updated[key as keyof IDebug])
    );
  localStorage.setItem(Keys.Debug, JSON.stringify(debug));
};
