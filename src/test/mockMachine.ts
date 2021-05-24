import { createMachine } from "xstate";

export const mockMachine = (id: string) =>
  createMachine({
    id,
    initial: "init",
    states: {
      init: {},
    },
  });
