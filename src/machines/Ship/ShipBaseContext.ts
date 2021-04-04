import { FlightPlan } from "../../api/FlightPlan";
import { Ship } from "../../api/Ship";
import { IStrategy } from "../../data/Strategy/IStrategy";

export type ShipBaseContext = ShipContext & {
  token: string;
  username: string;
  ship?: Ship;
  strategy: IStrategy;
  shouldCheckStrategy?: boolean;
  flightPlan?: FlightPlan;
};

export type ShipContext = {
  id: string;
  shipName: string;
};
