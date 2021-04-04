import { ActionMeta } from "xstate";
import { ShipContext } from "./ShipBaseContext";

export function debug<TContext extends ShipContext>(
  machineName: string,
  message?: string
) {
  return (c: TContext, e: any, d: ActionMeta<TContext, any>) => {
    console.warn(
      `[${c.shipName}] ${machineName}: ${d.state.value}` +
        (message !== undefined ? ` - ${message}` : ""),
      c
    );
  };
}
