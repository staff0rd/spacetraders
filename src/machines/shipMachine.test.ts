import * as xstate from "xstate";
import { shipMachine } from "./shipMachine";
import * as api from "../api";
import { Cargo } from "../api/Ship";
import { MarketContext } from "./MarketContext";
import {
  fromLocation,
  toLocation,
  testMarketResponse,
  testFlightPlan,
  testShip,
  testGood,
} from "./objectMother";

const waitFor = (
  machine: any,
  desiredState: string
): Promise<
  xstate.Interpreter<
    Record<string, any> | undefined,
    any,
    xstate.EventObject,
    {
      value: any;
      context: Record<string, any> | undefined;
    }
  >
> =>
  new Promise((res, rej) => {
    const interpreter = xstate.interpret(machine);
    interpreter["sendTo"] = jest.fn();
    const service = interpreter.onTransition((state) => {
      if (state.matches(desiredState)) {
        res(service);
      }
    });
    service.start();
  });

function getMachine(
  cargo: Cargo[],
  market: MarketContext = {
    FROM: { ...fromLocation, marketplace: [testGood("A")] },
    TO: { ...toLocation, marketplace: [testGood("A", 2)] },
  }
) {
  jest.spyOn(api, "getMarket").mockResolvedValue(testMarketResponse);
  jest.spyOn(api, "newFlightPlan").mockResolvedValue(testFlightPlan);
  jest
    .spyOn(Storage.prototype, "getItem")
    .mockReturnValue(JSON.stringify(market));
  const purchaseOrderSpy = jest
    .spyOn(api, "purchaseOrder")
    .mockImplementation();

  const machine = shipMachine.withContext({
    token: "123",
    username: "username",
    ship: {
      ...testShip,
      cargo,
    },
    locations: [fromLocation, toLocation],
    credits: 100000,
  });
  return { machine, purchaseOrderSpy };
}

describe("shipMachine", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(console, "log").mockImplementation();
  });
  it("should buy fuel if less than 10", async () => {
    const { machine, purchaseOrderSpy } = getMachine([
      { good: "FUEL", quantity: 5, totalVolume: 5 },
    ]);
    purchaseOrderSpy.mockResolvedValueOnce({
      ship: {
        ...testShip,
        cargo: [{ good: "FUEL", quantity: 10, totalVolume: 10 }],
        spaceAvailable: 0,
      },
      credits: 10,
    });
    await waitFor(machine, "inFlight");

    expect(purchaseOrderSpy).toHaveBeenCalledWith(
      "123",
      "username",
      "shipId",
      "FUEL",
      5
    );
  });
  it("should buy fuel if no fuel", async () => {
    const { machine, purchaseOrderSpy } = getMachine([]);
    purchaseOrderSpy.mockResolvedValueOnce({
      ship: {
        ...testShip,
        cargo: [{ good: "FUEL", quantity: 10, totalVolume: 10 }],
        spaceAvailable: 0,
      },
      credits: 10,
    });

    await waitFor(machine, "inFlight");

    expect(purchaseOrderSpy).toHaveBeenCalledWith(
      "123",
      "username",
      "shipId",
      "FUEL",
      10
    );
  });

  it("should not buy fuel if full", async () => {
    const { machine, purchaseOrderSpy } = getMachine([
      { good: "FUEL", quantity: 10, totalVolume: 10 },
    ]);

    purchaseOrderSpy.mockResolvedValueOnce({
      ship: {
        ...testShip,
        cargo: [
          { good: "FUEL", quantity: 10, totalVolume: 10 },
          { good: "A", quantity: 10, totalVolume: 10 },
        ],
        spaceAvailable: 0,
      },
      credits: 10,
    });

    await waitFor(machine, "inFlight");

    expect(purchaseOrderSpy).not.toHaveBeenCalledWith(
      "123",
      "username",
      "shipId",
      "FUEL",
      expect.any(Number)
    );
  });

  it("should purchase cargo", async () => {
    const { machine, purchaseOrderSpy } = getMachine([
      { good: "FUEL", quantity: 10, totalVolume: 10 },
    ]);
    purchaseOrderSpy.mockResolvedValueOnce({
      ship: {
        ...testShip,
        cargo: [
          { good: "FUEL", quantity: 10, totalVolume: 10 },
          { good: "A", quantity: 10, totalVolume: 10 },
        ],
        spaceAvailable: 0,
      },
      credits: 10,
    });

    await waitFor(machine, "inFlight");

    expect(purchaseOrderSpy).toHaveBeenCalledTimes(1);
    expect(purchaseOrderSpy).toHaveBeenCalledWith(
      "123",
      "username",
      "shipId",
      "A",
      10
    );
  });
});
