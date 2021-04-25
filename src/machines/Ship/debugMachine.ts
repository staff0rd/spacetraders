import { getDebug } from "data/localStorage/getDebug";
import { ActionMeta } from "xstate";
import { ShipContext } from "./ShipBaseContext";

export function debugShipMachine<TContext extends ShipContext>(
  shouldDebug: () => boolean,
  machineName: string,
  message?: string
) {
  return (c: TContext, e: any, d: ActionMeta<TContext, any>) => {
    if (c.id === getDebug().focusShip) {
      console.log(
        `[${c.shipName}] ${machineName}:${d.state.value}` +
          (message !== undefined ? ` - ${message}` : ""),
        c
      );
    }
  };
}
export function debugMachine<TContext>(
  shouldDebug: () => boolean,
  machineName: string,
  message?: string
) {
  return (c: TContext, e: any, d: ActionMeta<TContext, any>) => {
    if (shouldDebug()) {
      const shipName = (c as any).shipName;
      const printShipName = shipName ? ` [${shipName}] ` : "";
      console.log(
        `${machineName}${printShipName}: ${d.state.value}` +
          (message !== undefined ? ` - ${message}` : ""),
        c
      );
    }
  };
}
