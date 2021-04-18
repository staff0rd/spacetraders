import { Location } from "api/Location";

export type Route = {
  from: Location;
  to: Location;
  fuelNeeded: number;
  fuelAvailable: number;
  isWarp: boolean;
};
