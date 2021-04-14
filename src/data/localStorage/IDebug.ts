interface IDebug {
  focusShip?: string;
  debugTradeMachine: boolean;
  debugUpgradeMachine: boolean;
  debugProbeMachine: boolean;
  debugPlayerMachine: boolean;
  debugHaltMachine: boolean;
}

const key = "debug";

export const setDebug = (debug: Partial<IDebug>) => {
  const value = {
    ...getDebug(),
    ...debug,
  };
  localStorage.setItem(key, JSON.stringify(value));
};

export const getDebug = (): IDebug => {
  const value = localStorage.getItem(key);
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
