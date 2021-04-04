import { FlightPlan } from "../../api/FlightPlan";
import { Location } from "../../api/Location";
import { Ship } from "../../api/Ship";
import { IStrategy } from "../../data/Strategy/IStrategy";

export type ShipResponseContext = {
  ship?: Ship;
};

export type ShipBaseContext = ShipContext & {
  token: string;
  username: string;

  strategy: IStrategy;
  shouldCheckStrategy?: boolean;
  flightPlan?: FlightPlan;
  location?: Location;
} & ShipResponseContext;

export type ShipContext = {
  id: string;
  shipName: string;
};
