import { ActionMeta } from "xstate";
import { ShipContext } from "./ShipBaseContext";

export function debugShipMachine<TContext extends ShipContext>(
  machineName: string,
  message?: string
) {
  return (c: TContext, e: any, d: ActionMeta<TContext, any>) => {
    console.warn(
      ` ${machineName} [${c.shipName}]: ${d.state.value}` +
        (message !== undefined ? ` - ${message}` : ""),
      c
    );
  };
}
export function debugMachine<TContext>(machineName: string, message?: string) {
  return (c: TContext, e: any, d: ActionMeta<TContext, any>) => {
    console.warn(
      `${machineName}: ${d.state.value}` +
        (message !== undefined ? ` - ${message}` : ""),
      c
    );
  };
}
