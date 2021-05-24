import { FlightPlan } from "../../api/FlightPlan";
import { Location } from "../../api/Location";
import { Ship } from "../../api/Ship";

export type ShipResponseContext = {
  ship: Ship;
};

export type UserContext = {
  token: string;
  username: string;
};

export type ShipOrdersContext = {
  id: string;
  shouldCheckOrders?: boolean;
};

export type ShipBaseContext = UserContext &
  ShipContext &
  ShipOrdersContext & {
    flightPlan?: FlightPlan;
    location?: Location;
  } & ShipResponseContext;

export type ShipContext = {
  id: string;
};
