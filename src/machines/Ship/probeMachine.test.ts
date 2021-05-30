import { mockGetters, waitForMachine } from "test/helpers";
import { createLocation, createShip } from "test/objectMother";
import { probeMachine, States } from "./probeMachine";
import * as assignment from "data/getProbeAssignment";
import { setupMockRequests } from "test/mockRequests";
import { CachedShip } from "data/localStorage/CachedShip";

const mockProbeLocation = createLocation({ symbol: "probe" });
const probe = (shipId: string) => {
  const result = {
    location: mockProbeLocation.symbol,
    x: mockProbeLocation.x,
    y: mockProbeLocation.y,
    type: mockProbeLocation.type,
    shipId: shipId,
  };
  jest.spyOn(assignment, "getProbeAssignment").mockResolvedValue(result);
  return result;
};
const getMachine = (ship: CachedShip) =>
  probeMachine.withContext({
    probe: probe(ship.id),
    id: ship.id,
    token: "",
    username: "",
  });

beforeEach(() => {
  jest.restoreAllMocks();
  setupMockRequests();
});

describe("probeMachine", () => {
  it("travels if ship has no location", async () => {
    const ship = createShip({ location: undefined });
    mockGetters({ ships: [ship] });
    await waitForMachine(getMachine(ship), States.TravelToLocation);
  });
  it("travels if not at probe location", async () => {
    const ship = createShip();
    mockGetters({ ships: [ship] });
    await waitForMachine(getMachine(ship), States.TravelToLocation);
  });
});
