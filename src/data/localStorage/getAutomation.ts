import { Keys } from "./Keys";
import { IAutomation, initialAutoUpgrades } from "./IAutomation";

export const getAutomation = (): IAutomation => {
  const store = localStorage.getItem(Keys.Automation);
  return store
    ? parseAutomation(store)
    : {
        autoBuy: {
          shipType: "JW-MK-I",
          credits: 100000,
          maxShips: 20,
          on: true,
        },
        autoUpgrades: initialAutoUpgrades,
      };
};

export const setAutomation = (automation: IAutomation) => {
  localStorage.setItem(Keys.Automation, JSON.stringify(automation));
};
function parseAutomation(store: string): IAutomation {
  const result: IAutomation = JSON.parse(store);
  if (!result.autoUpgrades) result.autoUpgrades = initialAutoUpgrades;
  return result;
}
