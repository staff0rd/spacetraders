import { ActionMeta } from "xstate";
import { ShipContext } from "./ShipBaseContext";

export function debug(machineName: string) {
  return (c: ShipContext, e: any, d: ActionMeta<ShipContext, any>) => {
    console.warn(`[${c.shipName}] ${machineName}: ${d.state.value}`);
  };
}
