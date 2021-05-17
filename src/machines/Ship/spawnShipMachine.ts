import { spawn } from "xstate";
import { tradeMachine } from "./tradeMachine";
import { Ship } from "../../api/Ship";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import { Context } from "../playerMachine";
import { haltMachine } from "./haltMachine";
import { probeMachine } from "./probeMachine";
import { gotoMachine } from "./gotoMachine";
import { DateTime } from "luxon";
import { persistStrategy } from "data/persistStrategy";
import { getShip } from "data/localStorage/shipCache";
import * as api from "api";

export const getStrategy = (
  c: Context,
  ship: Ship
): { strategy: ShipStrategy; data?: any } => {
  const strategy = c.strategies!.find((s) => s.shipId === ship.id);
  if (!strategy) {
    persistStrategy(ship.id, ShipStrategy.Trade, ShipStrategy.Trade, false);
    return { strategy: ShipStrategy.Trade };
  }
  return strategy;
};

export function spawnShipMachine(c: Context): any {
  return (ship: Ship, strategy: ShipStrategy) => {
    const flightPlan = c.flightPlans.find((fp) => fp.shipId === ship.id);
    if (!flightPlan && !ship.location) {
      // api bug
      console.warn(
        "No flightPlan or ship.location for " + getShip(ship.id).name
      );
      api.getShip(c.token!, c.username!, ship.id);
      return;
    }
    const flightPlanExpired =
      flightPlan && DateTime.fromISO(flightPlan.arrivesAt) < DateTime.local();

    switch (strategy) {
      case ShipStrategy.Probe:
        return spawn(
          probeMachine.withContext({
            id: ship.id,
            token: c.token!,
            strategy: { strategy: ShipStrategy.Probe },
            username: c.user!.username,
            ship,
          })
        );

      case ShipStrategy.Trade:
        return spawn(
          tradeMachine.withContext({
            id: ship.id,
            token: c.token!,
            username: c.user!.username,
            ship,
            flightPlan: flightPlanExpired ? undefined : flightPlan,
            strategy: { strategy: ShipStrategy.Trade },
          }),
          { name: `ship-${ship.id}`, sync: true }
        ) as any;

      case ShipStrategy.Halt:
        return spawn(
          haltMachine.withContext({
            id: ship.id,
            token: c.token!,
            strategy: { strategy: ShipStrategy.Halt },
            username: c.user!.username,
            ship,
          })
        );

      case ShipStrategy.GoTo:
        return spawn(
          gotoMachine.withContext({
            id: ship.id,
            token: c.token!,
            strategy: {
              strategy: ShipStrategy.GoTo,
              data: getStrategy(c, ship).data,
            },
            username: c.user!.username,
            ship,
            flightPlan: flightPlanExpired ? undefined : flightPlan,
          })
        );

      default:
        throw new Error(`Unknown strategy: ${ShipStrategy[strategy]}`);
    }
  };
}
