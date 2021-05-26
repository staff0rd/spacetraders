import { Ship } from "api/Ship";
import { IShipOrder } from "data/IShipOrder";
import { Location } from "api/Location";

export type CachedShip = Omit<Ship, "location"> & {
  name: string;
  orders: IShipOrder[];
  location?: Location;
};
