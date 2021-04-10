import { FlightPlan } from "../../api/FlightPlan";
import { Location } from "../../api/Location";
import { Ship } from "../../api/Ship";
import { IStrategy } from "../../data/Strategy/IStrategy";

export type ShipResponseContext = {
  ship: Ship;
};

export type UserContext = {
  token: string;
  username: string;
};

export type ShipStrategyContext = {
  id: string;
  strategy: IStrategy;
  shouldCheckStrategy?: boolean;
};

export type ShipBaseContext = UserContext &
  ShipContext &
  ShipStrategyContext & {
    flightPlan?: FlightPlan;
    location?: Location;
  } & ShipResponseContext;

export type ShipContext = {
  id: string;
  shipName: string;
};
