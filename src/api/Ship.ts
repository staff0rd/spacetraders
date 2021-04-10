import { Cargo } from "./Cargo";
import { ShipBase } from "./ShipBase";
export type Ship = ShipBase & {
  id: string;
  location?: string;
  x: number;
  y: number;
  cargo: Cargo[];
  spaceAvailable: number;
  flightPlanId?: string;
};
