import {
  ActionMeta,
  EventObject,
  MachineConfig,
  StateNodeConfig,
  StateSchema,
} from "xstate";
import { debugMachine, debugShipMachine } from "./Ship/debugMachine";
import { ShipContext } from "./Ship/ShipBaseContext";
import { cloneDeep } from "lodash";

export function debugShipMachineStates<
  TContext extends ShipContext,
  TStateSchema extends StateSchema,
  TEvent extends EventObject
>(config: MachineConfig<TContext, TStateSchema, TEvent>) {
  return debugStates<TContext, TStateSchema, TEvent>(
    config,
    debugShipMachine as any
  );
}

export function debugMachineStates<
  TContext,
  TStateSchema extends StateSchema,
  TEvent extends EventObject
>(config: MachineConfig<TContext, TStateSchema, TEvent>, debugOn = () => true) {
  return debugStates(config, debugMachine, debugOn);
}

function debugStates<
  TContext,
  TStateSchema extends StateSchema,
  TEvent extends EventObject
>(
  config: MachineConfig<TContext, TStateSchema, TEvent>,
  debugHandler: <TContext>(
    shouldDebug: () => boolean,
    machineName: string,
    message?: string
  ) => (c: TContext, e: any, d: ActionMeta<TContext, any>) => void,
  debugOn = () => true
): MachineConfig<TContext, TStateSchema, TEvent> {
  if (!debugOn) return config;
  const clone = cloneDeep(config);
  Object.entries(clone.states!).forEach((value) => {
    const [, state] = value;
    const node = state as StateNodeConfig<TContext, any, TEvent>;

    if (node.entry) {
      if (Array.isArray(node.entry)) {
        node.entry.push(debugHandler(debugOn, clone.id!));
      } else {
        node.entry = [node.entry, debugHandler(debugOn, clone.id!)];
      }
    } else {
      node.entry = debugHandler(debugOn, clone.id!);
    }
  });

  return clone;
}
