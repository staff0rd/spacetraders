import { Ship } from "../../api/Ship";
import { ShipStrategy } from "../../data/ShipStrategy";

export type ShipBaseContext = {
  token: string;
  username: string;
  ship: Ship;
  strategy: ShipStrategy;
};
