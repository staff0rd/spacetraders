import { assign, createMachine } from "xstate";

export interface TimerContext {
  // The elapsed time (in seconds)
  elapsed: number;
  // The maximum time (in seconds)
  duration: number;
  // The interval to send TICK events (in seconds)
  interval: number;
}
export type TimerEvent =
  | {
      // The TICK event sent by the spawned interval service
      type: "TICK";
    }
  | {
      // User intent to update the duration
      type: "DURATION.UPDATE";
      value: number;
    }
  | {
      // User intent to reset the elapsed time to 0
      type: "RESET";
    };
export type TimerState =
  | { value: "running"; context: TimerContext }
  | { value: "paused"; context: TimerContext };
export const timerMachine = createMachine<TimerContext, TimerEvent, TimerState>(
  {
    initial: "running",
    context: {
      elapsed: 0,
      duration: 60,
      interval: 1,
    },
    states: {
      running: {
        invoke: {
          src: (context) => (cb) => {
            const interval = setInterval(() => {
              cb("TICK");
            }, 1000 * context.interval);

            return () => {
              clearInterval(interval);
            };
          },
        },
        always: {
          target: "paused",
          cond: (context) => {
            return context.elapsed >= context.duration;
          },
        },
        on: {
          TICK: {
            actions: assign({
              elapsed: (context) =>
                +(context.elapsed + context.interval).toFixed(2),
            }),
          },
        },
      },
      paused: {
        type: "final",
      },
    },
    on: {
      "DURATION.UPDATE": {
        actions: assign({
          duration: (_, event) => event.value,
        }),
      },
      RESET: {
        actions: assign({
          elapsed: 0,
        }) as any,
      },
    },
  }
);
