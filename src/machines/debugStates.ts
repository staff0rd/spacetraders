import {
  ActionMeta,
  EventObject,
  MachineConfig,
  StateNodeConfig,
  StateSchema,
} from "xstate";
import { debugMachine, debugShipMachine } from "./Ship/debug";
import { ShipContext } from "./Ship/ShipBaseContext";

export function debugShipMachineStates<
  TContext extends ShipContext,
  TStateSchema extends StateSchema,
  TEvent extends EventObject
>(config: MachineConfig<TContext, TStateSchema, TEvent>, debugOn = true) {
  return debugStates<TContext, TStateSchema, TEvent>(
    config,
    debugShipMachine as any,
    debugOn
  );
}

export function debugMachineStates<
  TContext,
  TStateSchema extends StateSchema,
  TEvent extends EventObject
>(config: MachineConfig<TContext, TStateSchema, TEvent>, debugOn = true) {
  return debugStates(config, debugMachine, debugOn);
}

function debugStates<
  TContext,
  TStateSchema extends StateSchema,
  TEvent extends EventObject
>(
  config: MachineConfig<TContext, TStateSchema, TEvent>,
  debugHandler: <TContext>(
    machineName: string,
    message?: string
  ) => (c: TContext, e: any, d: ActionMeta<TContext, any>) => void,
  debugOn: boolean
): MachineConfig<TContext, TStateSchema, TEvent> {
  if (!debugOn) return config;
  Object.entries(config.states!).forEach((value) => {
    const [name, state] = value;
    console.log("adding to " + name);
    const node = state as StateNodeConfig<TContext, any, TEvent>;

    if (node.entry) {
      if (Array.isArray(node.entry)) {
        node.entry.push(debugHandler(config.id!));
      } else {
        node.entry = [node.entry, debugHandler(config.id!)];
      }
    } else {
      node.entry = debugHandler(config.id!);
    }
  });

  console.log(JSON.stringify(config, null, 2));
  return config;
}
