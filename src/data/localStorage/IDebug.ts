export interface IDebug {
  focusShip?: string;
  debugTradeMachine: boolean;
  debugUpgradeMachine: boolean;
  debugProbeMachine: boolean;
  debugPlayerMachine: boolean;
  debugHaltMachine: boolean;
  debugBuyAndUpgradeShipMachine: boolean;
  debugSystemMonitorMachine: boolean;
  focusTradeRoute?: { from: string; to: string; good: string };
}
