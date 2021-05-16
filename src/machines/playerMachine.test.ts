import { interpret } from "xstate";
import { playerMachine, States } from "./playerMachine";
import * as req from "api/makeRequest";
import * as names from "data/names";
import {
  GetAvailableShipsResponse,
  GetAvailableStructuresResponse,
  GetShipsResponse,
  GetSystemsResponse,
  GetTokenResponse,
  GetUserResponse,
} from "api";
import { createUser, createShip, createSystem } from "test/objectMother";
import Bottleneck from "bottleneck";
import * as shipCache from "data/localStorage/shipCache";
import { GetFlightPlansResponse } from "api/GetFlightPlansResponse";
import * as strategies from "data/strategies";
import * as credits from "data/localStorage/getCredits";
import * as automation from "data/localStorage/getAutomation";
import { ShipStrategy } from "data/Strategy/ShipStrategy";

const mockRequests: { [path: string]: any } = {};

const mockRequest = <T>(path: string, response: T = {} as T) => {
  mockRequests[path] = response;
};

const mockShip = createShip();

jest.mock("data/Database");
jest.mock("data/ships");
jest.mock("data/probes");

const mockUser = createUser({ ships: [mockShip] });

beforeEach(() => {
  jest.spyOn(shipCache, "load").mockImplementation();
  jest.spyOn(credits, "getCredits").mockReturnValue(10000000);
  jest.spyOn(credits, "setCredits").mockImplementation();
  jest
    .spyOn(strategies, "getStrategies")
    .mockResolvedValue([{ shipId: mockShip.id, strategy: ShipStrategy.Halt }]);
  jest
    .spyOn(Bottleneck.prototype, "schedule")
    .mockImplementation((func: any) => func());
  jest.spyOn(req, "makeRequest").mockImplementation((path) => {
    const result = mockRequests[path];
    if (result) return result;
    throw new Error(`Should mock this: ${path}`);
  });
  jest.spyOn(names, "newPlayerName").mockReturnValue("user");
  jest
    .spyOn(shipCache, "getShips")
    .mockReturnValue([{ ...mockShip, name: "my ship!" }]);
  jest.spyOn(shipCache, "saveShip").mockImplementation();
  jest.spyOn(shipCache, "saveDetail").mockImplementation();
  jest.spyOn(automation, "getAutomation").mockReturnValue({
    autoBuy: {
      credits: 10000,
      maxShips: 2,
      on: true,
      shipType: "JW-MK-I",
    },
    autoUpgrades: [],
  });

  mockRequest<GetTokenResponse>("users/user/token", {
    token: "1234",
    user: mockUser,
  });

  mockRequest<GetUserResponse>("users/username", { user: mockUser });

  mockRequest<GetSystemsResponse>("game/systems", {
    systems: [createSystem()],
  });
  mockRequest<GetShipsResponse>("users/username/ships", {
    ships: [mockShip],
  });
  mockRequest<GetAvailableStructuresResponse>("game/structures");
  mockRequest<GetAvailableShipsResponse>("game/ships", {
    ships: [
      {
        class: "MK-I",
        type: "JW-MK-I",
        manufacturer: "Jackdaw",
        maxCargo: 50,
        plating: 1,
        purchaseLocations: [{ location: "S1-L1", price: 20000 }],
        speed: 1,
        weapons: 1,
      },
    ],
  });
  mockRequest<GetFlightPlansResponse>("game/systems/OE/flight-plans", {
    flightPlans: [],
  });
});

describe("playerMachine", () => {
  it("should tick after startup", (done) => {
    const playerService = interpret(playerMachine).onTransition((state) => {
      if (state.matches(States.Tick)) {
        done();
      }
    });

    playerService.start();
  });
});
