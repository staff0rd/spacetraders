import { ShipResponseContext } from "./ShipBaseContext";

export function getCargoQuantity(c: ShipResponseContext, good: string): number {
  return c.ship?.cargo.find((o) => o.good === good)?.quantity || 0;
}
