import { Ship } from "api/Ship";
import { IShipOrder } from "data/IShipOrder";
import { Location } from "api/Location";
import { FlightPlan } from "api/FlightPlan";

export type CachedShip = Omit<Ship, "location" | "flightPlanId"> & {
  name: string;
  orders: IShipOrder[];
  location?: Location;
  flightPlan?: FlightPlan;
  lastProfit?: number;
};
