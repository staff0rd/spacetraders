import { assign, createMachine } from "xstate";
import * as api from "../api";
import { AvailableLoan } from "../api/AvailableLoan";

type Context = {
  token: string;
  username: string;
  availableLoans: AvailableLoan[];
  response?: api.GetUserResponse;
};

export const getLoanMachine = createMachine<Context, any, any>({
  id: "getLoan",
  initial: "getAvailableLoans",
  context: {
    token: "",
    username: "",
    availableLoans: [],
    response: undefined,
  },
  states: {
    getAvailableLoans: {
      invoke: {
        src: (context) => api.getAvailableLoans(context.token),
        onDone: {
          target: "requestNewLoan",
          actions: assign<Context>({
            availableLoans: (c: Context, e: any) => e.data.loans,
          }) as any,
        },
      },
    },
    requestNewLoan: {
      invoke: {
        src: (context) =>
          api.requestNewLoan(context.token, context.username, "STARTUP"),
        onDone: {
          target: "done",
          actions: assign<Context>({
            response: (c: any, e: any) => e.data,
          }) as any,
        },
      },
    },
    done: {
      type: "final",
      data: {
        response: (context: Context) => context.response,
      },
    },
  },
});
