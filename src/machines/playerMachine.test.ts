import { playerMachine, States } from "./playerMachine";
import * as names from "data/names";
import {
  GetAvailableShipsResponse,
  GetAvailableStructuresResponse,
  GetLocationResponse,
  GetShipsResponse,
  GetSystemsResponse,
  GetTokenResponse,
  GetUserResponse,
} from "api";
import {
  createUser,
  createShip,
  createSystem,
  createLocation,
} from "test/objectMother";
import { GetFlightPlansResponse } from "api/GetFlightPlansResponse";
import * as api from "api";

import * as trade from "machines/Ship/tradeMachine";
import { mockMachine } from "test/mockMachine";
import { mockRequest, setupMockRequests } from "test/mockRequests";
import { mockGetters, waitForMachine } from "test/helpers";

const mockLocation = createLocation();
const mockShip = createShip();
const mockUser = createUser({
  ships: [{ ...mockShip, location: mockLocation.symbol }],
});

jest.mock("data/Database");
jest.mock("data/ships");
jest.mock("data/probes");

let createMachineSpy: jest.SpyInstance;
let mockTradeMachine: any;

beforeEach(() => {
  setupMockRequests();
  mockGetters({
    ships: [mockShip],
  });

  mockTradeMachine = mockMachine("trade");
  jest.spyOn(trade, "tradeMachine").mockReturnValue(mockTradeMachine);

  jest.spyOn(names, "newPlayerName").mockReturnValue("user");

  createMachineSpy = jest.spyOn(mockTradeMachine, "withContext");

  mockRequest<GetTokenResponse>("users/user/token", {
    token: "1234",
    user: mockUser,
  });

  mockRequest<GetUserResponse>("users/username", { user: mockUser });

  mockRequest<GetSystemsResponse>("game/systems", {
    systems: [createSystem()],
  });
  mockRequest<GetShipsResponse>("users/username/ships", {
    ships: [{ ...mockShip, location: mockLocation.symbol }],
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
  mockRequest<GetLocationResponse>("game/locations/S1-L1/marketplace", {
    location: mockLocation,
  });
  mockRequest<GetFlightPlansResponse>("game/systems/S1/flight-plans", {
    flightPlans: [],
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("playerMachine", () => {
  it("should tick after startup", async () => {
    await waitForMachine(playerMachine, States.Tick);
  });

  it("spawns ship machine", async () => {
    await waitForMachine(playerMachine, States.Tick, false);
    expect(createMachineSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: mockShip.id })
    );
  });

  it("gets flightplans if ships in system", async () => {
    const spy = jest.spyOn(api, "getFlightPlans");
    mockGetters({ ships: [createShip()] });
    await waitForMachine(playerMachine, States.Ready);

    expect(spy).toHaveBeenCalled();
  });

  it("does not get flightplans if no ships", async () => {
    const spy = jest.spyOn(api, "getFlightPlans");
    mockGetters();
    await waitForMachine(playerMachine, States.Ready);
    expect(spy).not.toHaveBeenCalled();
  });
});
