import { Ship } from "../../api/Ship";
import { IStrategy } from "../../data/Strategy/IStrategy";

export type ShipBaseContext = {
  id: string;
  token: string;
  username: string;
  ship?: Ship;
  strategy: IStrategy;
  shouldCheckStrategy?: boolean;
};
