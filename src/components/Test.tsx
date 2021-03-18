import { useMachine } from "@xstate/react";
import { testMachine } from "../machines/testMachine";

export const Test = () => {
  useMachine(testMachine, { devTools: true });
  return <></>;
};
