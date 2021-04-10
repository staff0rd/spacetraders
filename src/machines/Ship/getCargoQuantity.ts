import { ShipResponseContext } from "./ShipBaseContext";

export function getCargoQuantity(c: ShipResponseContext, good: string): number {
  return c.ship?.cargo.find((o) => o.good === good)?.quantity || 0;
}

export const getNonFuelCargoQuantity = (c: ShipResponseContext): number =>
  c
    .ship!.cargo.filter((o) => o.good !== "FUEL")
    .map((c) => c.quantity)
    .reduce((a, b) => a + b);
