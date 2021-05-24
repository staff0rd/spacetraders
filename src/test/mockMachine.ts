import { createMachine } from "xstate";

export const mockMachine = <T>(id: string) =>
  createMachine<T>({
    id,
    initial: "init",
    states: {
      init: {},
    },
  });
