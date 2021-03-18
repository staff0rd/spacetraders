import { assign, Machine } from "xstate";

export const testMachine = Machine(
  {
    id: "player",
    initial: "idle",
    context: {
      value: "one",
    },
    states: {
      idle: {
        entry: "log",
        on: { "": "request" },
      },
      request: {
        invoke: {
          src: () => {
            console.log("Promise invoked");
            return Promise.resolve({ newValue: "two" });
          },
          onDone: {
            target: "loaded",
            actions: assign({
              value: (context, event) => {
                console.log("received", event);
                return event.data.newValue;
              },
            }),
          },
        },
      },
      check: {
        on: {
          "": [
            { cond: (context) => context.value === "two", target: "loaded" },
            { cond: (context) => context.value !== "two", target: "idle" },
          ],
        },
      },
      loaded: {
        entry: "log",
      },
    },
  },
  {
    actions: {
      log: (a, b, c) => console.log(c.state.value, a.value),
    },
  }
);

// prints "loaded two" x5
export const testMachine1 = Machine(
  {
    id: "player",
    initial: "idle",
    context: {
      value: "one",
    },
    states: {
      idle: {
        entry: "log",
        on: { "": "check" },
      },
      check: {
        exit: ["log", assign({ value: () => "two" })],
        on: {
          "": [
            { cond: (context) => context.value === "two", target: "loaded" },
            { cond: (context) => context.value !== "two", target: "idle" },
          ],
        },
      },
      loaded: {
        entry: "log",
      },
    },
  },
  {
    actions: {
      log: (a, b, c) => console.log(c.state.value, a.value),
    },
  }
);
