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

export const initialAutoUpgrades: IAutoUpgrade[] = [
  {
    on: false,
    credits: 200000,
    fromShipType: "JW-MK-I",
    toShipType: "GR-MK-I",
    maxShips: 5,
    role: "Trade",
  },
];
