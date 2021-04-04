import { ShipContext } from "./ShipBaseContext";

export function printError<TContext extends ShipContext>() {
  return {
    actions: [printErrorAction<TContext>()],
  };
}
export function printErrorAction<TContext extends ShipContext>() {
  return (c: TContext, e: any) =>
    console.error(`[${c.shipName}] caught an error`, e, c);
}
