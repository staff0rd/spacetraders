import { spawn } from "xstate";
import { tradeMachine } from "./tradeMachine";
import { Context } from "../playerMachine";
import { haltMachine } from "./haltMachine";
import { probeMachine } from "./probeMachine";
import { gotoMachine } from "./gotoMachine";
import { getShip } from "data/localStorage/shipCache";
import { CachedShip } from "data/localStorage/CachedShip";
import * as api from "api";
import { ShipOrders } from "data/IShipOrder";

export function spawnShipMachine(c: Context): any {
  return (ship: CachedShip) => {
    const flightPlan = c.flightPlans.find((fp) => fp.shipId === ship.id);
    if (!flightPlan && !ship.location) {
      // api bug
      console.warn(
        "No flightPlan or ship.location for " + getShip(ship.id).name
      );
      api.getShip(c.token!, c.username!, ship.id);
      return;
    }

    switch (ship.orders[0].order) {
      case ShipOrders.Probe:
        return spawn(
          probeMachine.withContext({
            id: ship.id,
            token: c.token!,
            username: c.user!.username,
          })
        );

      case ShipOrders.Trade:
        return spawn(
          tradeMachine().withContext({
            id: ship.id,
            token: c.token!,
            username: c.user!.username,
            shouldCheckOrders: true,
          }),
          { name: `ship-${ship.id}`, sync: true }
        ) as any;

      case ShipOrders.Halt:
        return spawn(
          haltMachine.withContext({
            id: ship.id,
            token: c.token!,
            username: c.user!.username,
          })
        );

      case ShipOrders.GoTo:
        return spawn(
          gotoMachine.withContext({
            id: ship.id,
            token: c.token!,
            username: c.user!.username,
            destination: ship.orders[0].payload?.location!,
          })
        );

      default:
        throw new Error(`Unknown order: ${ShipOrders[ship.orders[0]?.order]}`);
    }
  };
}
