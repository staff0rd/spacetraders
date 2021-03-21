import * as xstate from "xstate";
import { LocationWithDistance, shipMachine } from "./shipMachine";
import * as api from "../api";
import { FlightPlan } from "../api/FlightPlan";
import { DateTime } from "luxon";
import { Cargo } from "../api/Ship";

const testShip = {
  id: "shipId",
  location: "ABC",
  x: 0,
  y: 0,
  type: "type",
  class: "class",
  maxCargo: 10,
  speed: 1,
  manufacturer: "manufacturer",
  plating: 1,
  weapons: 1,
  spaceAvailable: 10,
  cargo: [],
};

const testFlightPlan: { flightPlan: FlightPlan } = {
  flightPlan: {
    arrivesAt: DateTime.now().toISO(),
    createdAt: DateTime.now().toISO(),
    from: "ABC",
    to: "ABC",
    id: "id",
    shipId: "shipId",
    shipType: "shipType",
    username: "username",
  },
};

const testLocation: LocationWithDistance = {
  symbol: "ABC",
  distance: 10,
  x: 0,
  y: 0,
  type: "type",
  name: "name",
  ships: [],
  anomaly: "AB",
  marketplace: [
    {
      symbol: "GOOD_A",
      pricePerUnit: 10,
      quantityAvailable: 100,
      volumePerUnit: 1,
    },
  ],
};

const testMarketResponse = {
  location: {
    marketplace: [
      {
        pricePerUnit: 1,
        quantityAvailable: 500,
        symbol: "FUEL",
        volumePerUnit: 1,
      },
    ],
  },
} as api.GetMarketResponse;

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

function getMachine(cargo: Cargo[]) {
  jest.spyOn(api, "getMarket").mockResolvedValue(testMarketResponse);
  jest.spyOn(api, "newFlightPlan").mockResolvedValue(testFlightPlan);
  jest
    .spyOn(Storage.prototype, "getItem")
    .mockReturnValue(JSON.stringify({ ABC: testLocation }));
  const purchaseOrderSpy = jest
    .spyOn(api, "purchaseOrder")
    .mockResolvedValueOnce({
      ship: {
        ...testShip,
        cargo: [{ good: "FUEL", quantity: 10, totalVolume: 10 }],
      },
      credits: 10,
    })
    .mockResolvedValueOnce({
      ship: {
        ...testShip,
        cargo: [
          { good: "FUEL", quantity: 10, totalVolume: 10 },
          { good: "GOOD_A", quantity: 10, totalVolume: 10 },
        ],
        spaceAvailable: 0,
      },
      credits: 10,
    });

  const machine = shipMachine.withContext({
    token: "123",
    username: "username",
    ship: {
      ...testShip,
      cargo,
    },
    locations: [testLocation],
  });
  return { machine, purchaseOrderSpy };
}

describe("shipMachine", () => {
  it("should buy fuel if less than 10", async () => {
    const { machine, purchaseOrderSpy } = getMachine([
      { good: "FUEL", quantity: 5, totalVolume: 5 },
    ]);

    await waitFor(machine, "createFlightPlan");

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

    await waitFor(machine, "createFlightPlan");

    expect(purchaseOrderSpy).toHaveBeenCalledWith(
      "123",
      "username",
      "shipId",
      "FUEL",
      10
    );
  });
});
