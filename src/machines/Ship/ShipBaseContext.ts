import { FlightPlan } from "../../api/FlightPlan";
import { Location } from "../../api/Location";
import { Ship } from "../../api/Ship";
import { IStrategy } from "../../data/Strategy/IStrategy";

export type ShipBaseContext = ShipContext & {
  token: string;
  username: string;
  ship?: Ship;
  strategy: IStrategy;
  shouldCheckStrategy?: boolean;
  flightPlan?: FlightPlan;
  location?: Location;
};

export type ShipContext = {
  id: string;
  shipName: string;
};
