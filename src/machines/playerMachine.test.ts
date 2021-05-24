import { interpret } from "xstate";
import { playerMachine, States } from "./playerMachine";
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
import { GetFlightPlansResponse } from "api/GetFlightPlansResponse";

import * as trade from "machines/Ship/tradeMachine";
import { mockMachine } from "test/mockMachine";
import { mockRequest, setupMockRequests } from "test/mockRequests";
import { mockGetters } from "test/helpers";

const mockShip = createShip();
const mockUser = createUser({ ships: [mockShip] });

jest.mock("data/Database");
jest.mock("data/ships");
jest.mock("data/probes");

beforeEach(() => {
  setupMockRequests();
  mockGetters({
    ships: [{ ...mockShip, name: "my ship!" }],
  });

  jest.spyOn(trade, "tradeMachine").mockReturnValue(mockMachine("trade"));

  jest.spyOn(names, "newPlayerName").mockReturnValue("user");

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
