import { tradeMachine, Context as ShipContext, States } from "./tradeMachine";
import { Cargo } from "../../api/Cargo";
import { createLocation, createShip } from "test/objectMother";
import { CachedShip } from "data/localStorage/shipCache";
import { waitForMachine, mockGetters } from "test/helpers";
import { setupMockRequests, mockRequest } from "test/mockRequests";
import * as api from "api";

const ship = createShip();
const location = createLocation();

const context = (ship: CachedShip, cargo: Cargo[]): ShipContext => ({
  token: "123",
  username: "username",
  id: ship.id,
  ship,
});

jest.mock("data/Database");
jest.mock("data/tradeData");

const getMachine = (shipContext: ShipContext) =>
  tradeMachine().withContext(shipContext);

describe("tradeMachine", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockGetters({ ships: [ship] });
    setupMockRequests();
    mockRequest<api.GetLocationResponse>(
      "game/locations/OE-PM-TR/marketplace",
      { location }
    );
  });
  it("will idle after init", async () => {
    await waitForMachine(getMachine(context(ship, [])), States.Idle);
  });
});
