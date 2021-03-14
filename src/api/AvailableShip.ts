import { PurchaseLocation } from "./PurchaseLocation";
import { ShipBase } from "./ShipBase";

export type AvailableShip = ShipBase & {
  purchaseLocations: PurchaseLocation[];
};
