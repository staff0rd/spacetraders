import { IShipDetail } from "data/IShipDetail";
import { FlightPlan } from "api/FlightPlan";
import { Ship } from "api/Ship";

export type ExtendedShip = Ship &
  IShipDetail & {
    strategy: string;
    flightPlan: FlightPlan | undefined;
    locationName: string;
  };
