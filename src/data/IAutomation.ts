export interface IAutomation {
  autoBuy: {
    shipType: string;
    credits: number;
    maxShips: number;
    on: boolean;
  };
  autoUpgrade: IAutoUpgrade;
}

export interface IUpgrade {
  role: string;
  fromShipType: string;
  toShipType: string;
  credits: number;
  maxShips: number;
}

interface IAutoUpgrade {
  on: boolean;
  upgrades: IUpgrade[];
}

const initialAutoUpgrade: IAutoUpgrade = {
  on: false,
  upgrades: [
    {
      credits: 200000,
      fromShipType: "JW-MK-I",
      toShipType: "GR-MK-I",
      maxShips: 5,
      role: "Trade",
    },
  ],
};

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
        autoUpgrade: initialAutoUpgrade,
      };
};

export const setAutomation = (automation: IAutomation) => {
  localStorage.setItem("automation", JSON.stringify(automation));
};
function parseAutomation(store: string): IAutomation {
  const result: IAutomation = JSON.parse(store);
  if (!result.autoUpgrade) result.autoUpgrade = initialAutoUpgrade;
  return result;
}
