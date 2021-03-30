import { ShipStrategy } from "./ShipStrategy";

export interface IShipStrategy {
  shipId: string;
  strategy: ShipStrategy;
  data?: object;
}
