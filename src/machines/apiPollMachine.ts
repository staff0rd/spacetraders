import { assign, createMachine } from "xstate";
import { timerMachine } from "./timerMachine";
import { ApiContext, ApiEvent, ApiState } from "./apiMachine";

export const apiPollMachine = <TResponse>(apiCall: () => Promise<TResponse>) =>
  createMachine<ApiContext<TResponse>, ApiEvent, ApiState<TResponse>>({
    id: "api",
    initial: "loading",
    context: {
      result: undefined,
      error: undefined,
    },
    states: {
      idle: {
        on: {
          FETCH: "loading",
        },
      },
      loading: {
        invoke: {
          id: "apiCall",
          src: apiCall,
          onDone: {
            target: "success",
            actions: assign({ result: (_, event) => event.data }),
          },
          onError: {
            target: "failure",
            actions: assign({ error: (_, event) => event.data }),
          },
        },
      },
      success: {
        invoke: {
          src: timerMachine,
          onDone: "loading",
        },
      },
      failure: {
        on: {
          RETRY: "loading",
        },
      },
    },
  });
