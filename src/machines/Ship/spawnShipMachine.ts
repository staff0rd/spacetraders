import { spawn } from "xstate";
import db from "../../data";
import { LocationWithDistance, tradeMachine } from "./tradeMachine";
import { Ship } from "../../api/Ship";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import { Context } from "../playerMachine";
import { haltMachine } from "./haltMachine";
import { probeMachine } from "./probeMachine";

export const getStrategy = (
  c: Context,
  ship: Ship
): { strategy: ShipStrategy; data?: any } => {
  const strategy = c.strategies!.find((s) => s.shipId === ship.id);
  if (!strategy) {
    //const { strategy: playerStrategy, data } = getPlayerStrategy();
    db.strategies.put({
      shipId: ship.id,
      strategy: ShipStrategy.Trade,
    });
    return { strategy: ShipStrategy.Trade };
  }
  return strategy;
};

export function spawnShipMachine(c: Context): any {
  return (ship: Ship, strategy: ShipStrategy) => {
    const flightPlan = c.flightPlans.find((fp) => fp.shipId === ship.id);
    if (!flightPlan && !ship.location) {
      // api bug
      console.warn("No flightPlan or ship.location for shipId " + ship.id);
      return;
    }
    const system = (ship.location || flightPlan!.destination).substring(0, 2);
    const markets = c.systems![system]!;
    const shipName = c.shipNames?.find((s) => s.shipId === ship.id)?.name || "";
    if (!shipName) console.error("No ship name for " + ship.id);

    switch (strategy) {
      case ShipStrategy.Probe:
        return spawn(
          probeMachine.withContext({
            id: ship.id,
            token: c.token!,
            strategy: { strategy: ShipStrategy.Probe },
            username: c.user!.username,
            ship,
            shipName,
          })
        );

      case ShipStrategy.Trade:
        return spawn(
          tradeMachine.withContext({
            id: ship.id,
            token: c.token!,
            username: c.user!.username,
            ship,
            locations: Object.keys(markets).map(
              (symbol) => markets[symbol] as LocationWithDistance
            ),
            flightPlan,
            strategy: { strategy: ShipStrategy.Trade },
            shipName,
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
            shipName,
          })
        );

      default:
        throw new Error(`Unknown strategy: ${ShipStrategy[strategy]}`);
    }
  };
}
