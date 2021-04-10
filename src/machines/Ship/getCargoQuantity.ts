import { Cargo } from "../../api/Cargo";

export function getCargoQuantity(c: Cargo[], good: string): number {
  return c.find((o) => o.good === good)?.quantity || 0;
}

export const getNonFuelCargoQuantity = (c: Cargo[]): number =>
  c
    .filter((o) => o.good !== "FUEL")
    .map((c) => c.quantity)
    .reduce((a, b) => a + b);
