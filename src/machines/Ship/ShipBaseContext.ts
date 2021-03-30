import { Ship } from "../../api/Ship";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";

export type ShipBaseContext = {
  token: string;
  username: string;
  ship: Ship;
  strategy: ShipStrategy;
};
