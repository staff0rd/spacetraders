export interface IAutomation {
  autoBuy: {
    shipType: string;
    credits: number;
    maxShips: number;
    on: boolean;
  };
  autoUpgrades: IAutoUpgrade[];
}

export interface IAutoUpgrade {
  role: string;
  fromShipType: string;
  toShipType: string;
  credits: number;
  maxShips: number;
  on: boolean;
}

const initialAutoUpgrades: IAutoUpgrade[] = [
  {
    on: false,
    credits: 200000,
    fromShipType: "JW-MK-I",
    toShipType: "GR-MK-I",
    maxShips: 5,
    role: "Trade",
  },
];

export const getAutomation = (): IAutomation => {
  const store = localStorage.getItem("automation");
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
  localStorage.setItem("automation", JSON.stringify(automation));
};
function parseAutomation(store: string): IAutomation {
  const result: IAutomation = JSON.parse(store);
  if (!result.autoUpgrades) result.autoUpgrades = initialAutoUpgrades;
  return result;
}
