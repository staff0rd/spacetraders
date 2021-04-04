import { ActionMeta } from "xstate";
import { ShipContext } from "./ShipBaseContext";

export function printError<TContext extends ShipContext>() {
  return {
    actions: [printErrorAction<TContext>()],
  };
}
export function printErrorAction<TContext extends ShipContext>() {
  return (c: TContext, e: any, d: ActionMeta<TContext, any>) =>
    console.error(`[${c.shipName}] ${d.state.value}: Error`, e, c);
}
