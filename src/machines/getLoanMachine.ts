import { assign, createMachine } from "xstate";
import * as api from "../api";
import { AvailableLoan } from "../api/AvailableLoan";
import { Loan } from "../api/Loan";

type Context = {
  token: string;
  username: string;
  availableLoans: AvailableLoan[];
  loan: Loan | undefined;
};

export const getLoanMachine = createMachine<Context, any, any>({
  id: "getLoan",
  initial: "getAvailableLoans",
  context: {
    token: "",
    username: "",
    availableLoans: [],
    loan: undefined,
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
          actions: assign({ loan: (c: any, e: any) => e.data }) as any,
        },
      },
    },
    done: {
      type: "final",
      data: {
        loan: (context: Context) => context.loan,
      },
    },
  },
});
