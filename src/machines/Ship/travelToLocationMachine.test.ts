import { travelToLocationMachine } from "./travelToLocationMachine";
import * as xstate from "xstate";
import { Ship } from "../../api/Ship";

describe("travelToLocationMachine", () => {
  xstate.interpret(
    travelToLocationMachine.withContext({
      id: "id",
      ship: {} as Ship,
      to: "MY-LO",
      token: "token",
      username: "username",
    })
  );

  it("");
});
