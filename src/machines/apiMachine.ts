import { assign, createMachine, sendParent } from "xstate";

export type ApiResult<T> = {
  type: "API_RESULT";
  result: T;
};

export const apiMachine = <TResponse>(apiCall: () => Promise<TResponse>) =>
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
        onEntry: sendParent<
          ApiContext<TResponse>,
          ApiEvent,
          ApiResult<TResponse>
        >(
          (context) =>
            ({
              type: "API_RESULT",
              result: context.result,
            } as ApiResult<TResponse>)
        ),
      },
      failure: {
        on: {
          RETRY: "loading",
        },
      },
    },
  });

export type ApiContext<T> = {
  result?: T;
  error?: string;
};
export type ApiState<T> =
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
export type ApiEvent =
  | { type: "FETCH" }
  | { type: "LOADING" }
  | { type: "RETRY" };
