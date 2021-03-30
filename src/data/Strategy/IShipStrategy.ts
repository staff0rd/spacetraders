import { IStrategy } from "./IStrategy";

export interface IShipStrategy extends IStrategy {
  shipId: string;
}
