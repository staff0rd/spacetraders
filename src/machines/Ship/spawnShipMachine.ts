import { spawn } from "xstate";
import db from "../../data";
import { LocationWithDistance, tradeMachine } from "./tradeMachine";
import { Ship } from "../../api/Ship";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import { Context } from "../playerMachine";
import { ChangeStrategyPayload } from "../../data/Strategy/StrategyPayloads";
import { haltMachine } from "./haltMachine";
import { probeMachine } from "./probeMachine";

const getStrategy = (
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
  return (ship: Ship) => {
    const flightPlan = c.flightPlans.find((fp) => fp.shipId === ship.id);
    if (!flightPlan && !ship.location) {
      // api bug
      throw new Error("No flightPlan or ship.location for shipId " + ship.id);
    }
    const system = (ship.location || flightPlan!.destination).substring(0, 2);
    const markets = c.systems![system]!;
    const shipName = c.shipNames?.find((s) => s.shipId === ship.id)?.name || "";
    if (!shipName) console.error("No ship name for " + ship.id);

    const { data, strategy } = getStrategy(c, ship);

    if (IsStrategy(ShipStrategy.Probe, strategy, data))
      return spawn(
        probeMachine.withContext({
          id: ship.id,
          token: c.token!,
          strategy: { strategy: ShipStrategy.Probe },
          username: c.user!.username,
          ship,
          system,
          shipName,
        })
      );

    if (IsStrategy(ShipStrategy.Trade, strategy, data))
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

    if (IsStrategy(ShipStrategy.Halt, strategy, data))
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

    throw new Error(
      `Unknown strategy: [${
        ShipStrategy[strategy]
      } (${strategy})] data: ${JSON.stringify(data)}`
    );
  };
}
function IsStrategy(
  strategy: ShipStrategy,
  shipStrategy: ShipStrategy,
  data: any
) {
  const result =
    shipStrategy === strategy ||
    (shipStrategy === ShipStrategy.Change &&
      (data as ChangeStrategyPayload).from.strategy === strategy);
  return result;
}
