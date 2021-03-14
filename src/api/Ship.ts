import { ShipBase } from "./ShipBase";

export type Ship = ShipBase & {
  id: string;
  location: string;
  x: number;
  y: number;
  cargo: any[];
  spaceAvailable: number;
};
