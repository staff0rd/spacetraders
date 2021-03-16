import { assign, createMachine, StateMachine } from "xstate";
import {
  TimerContext,
  TimerEvent,
  timerMachine,
  TimerState,
} from "./timerMachine";

type ApiContext<T> = {
  result?: T;
  error?: string;
};
type ApiState<T> =
  | {
      value: "idle";
      context: ApiContext<T> & { result: undefined; error: undefined };
    }
  | {
      value: "loading";
      context: ApiContext<T> & { result: undefined; error: undefined };
    }
  | {
      value: "failure";
      context: ApiContext<T> & { result: undefined; error: string };
    }
  | {
      value: "success";
      context: ApiContext<T> & {
        result: T;
        error: undefined;
      };
    };
type ApiEvent = { type: "FETCH" } | { type: "LOADING" } | { type: "RETRY" };

type Success = {};
type SuccessWithRetry = {
  invoke: {
    src: StateMachine<TimerContext, any, TimerEvent, TimerState>;
    onDone: string;
  };
};

const successWithRetry: SuccessWithRetry = {
  invoke: {
    src: timerMachine,
    onDone: "loading",
  },
};

export const apiPollMachine = <TResponse>(apiCall: () => Promise<TResponse>) =>
  apiMachine(apiCall, successWithRetry);

export const apiCallMachine = <TResponse>(apiCall: () => Promise<TResponse>) =>
  apiMachine(apiCall);

const apiMachine = <TResponse>(
  apiCall: () => Promise<TResponse>,
  success: Success | SuccessWithRetry = {}
) =>
  createMachine<ApiContext<TResponse>, ApiEvent, ApiState<TResponse>>({
    id: "api",
    initial: "idle",
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
      success,
      failure: {
        on: {
          RETRY: "loading",
        },
      },
    },
  });
