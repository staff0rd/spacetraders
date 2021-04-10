import { ActionMeta } from "xstate";
import { ShipContext } from "./ShipBaseContext";

export function debugShipMachine<TContext extends ShipContext>(
  machineName: string,
  message?: string
) {
  return (c: TContext, e: any, d: ActionMeta<TContext, any>) => {
    console.log(
      ` ${machineName} [${c.shipName}]: ${d.state.value}` +
        (message !== undefined ? ` - ${message}` : ""),
      c
    );
  };
}
export function debugMachine<TContext>(machineName: string, message?: string) {
  return (c: TContext, e: any, d: ActionMeta<TContext, any>) => {
    const shipName = (c as any).shipName;
    const printShipName = shipName ? ` [${shipName}] ` : "";
    console.log(
      `${machineName}${printShipName}: ${d.state.value}` +
        (message !== undefined ? ` - ${message}` : ""),
      c
    );
  };
}
