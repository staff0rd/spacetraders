import { ShipBase } from "./ShipBase";
type Cargo = {
  good: string;
  quantity: number;
  totalVolume: number;
};

export type Ship = ShipBase & {
  id: string;
  location: string;
  x: number;
  y: number;
  cargo: Cargo[];
  spaceAvailable: number;
};
