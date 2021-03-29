import { spawn } from "xstate";
import db from "../../data";
import { LocationWithDistance, tradeMachine } from "./tradeMachine";
import { Ship } from "../../api/Ship";
import { ShipStrategy } from "../../data/ShipStrategy";
import { Context } from "../playerMachine";

export function spawnShipMachine(c: Context): any {
  return (ship: Ship) => {
    const flightPlan = c.flightPlans.find((fp) => fp.shipId === ship.id);
    const system = (ship.location || flightPlan!.to).substring(0, 2);
    const markets = c.systems![system]!;

    db.strategies.put({
      shipId: ship.id,
      strategy: ShipStrategy.Trade,
    });

    return spawn(
      tradeMachine.withContext({
        token: c.token!,
        username: c.user!.username,
        ship: ship,
        credits: c.user!.credits,
        locations: Object.keys(markets).map(
          (symbol) => markets[symbol] as LocationWithDistance
        ),
        flightPlan,
        strategy: ShipStrategy.Trade,
      }),
      { name: `ship-${ship.id}`, sync: true }
    ) as any;
  };
}
