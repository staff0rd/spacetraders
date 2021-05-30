import { tradeMachine, Context as ShipContext, States } from "./tradeMachine";
import { createLocation, createOrder, createShip } from "test/objectMother";
import { waitForMachine, mockGetters } from "test/helpers";
import { setupMockRequests, mockRequest } from "test/mockRequests";
import * as api from "api";
import { ShipOrders } from "data/IShipOrder";
import * as shipCache from "data/localStorage/shipCache";

const createContext = (
  shipId: string,
  shipContext: Partial<ShipContext> = {}
): ShipContext => ({
  token: "123",
  username: "username",
  shouldCheckOrders: true,
  id: shipId,
  ...shipContext,
});

jest.mock("data/Database");
jest.mock("data/tradeData");
jest.mock("data/ships");
jest.mock("data/markets");

const getMachine = (shipContext: ShipContext) =>
  tradeMachine().withContext(shipContext);

describe("tradeMachine", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    setupMockRequests();
    mockRequest<api.GetLocationResponse>("game/locations/S1-L1/marketplace", {
      location: createLocation(),
    });
  });
  it("will idle after init", async () => {
    const ship = createShip({ name: "A" });
    mockGetters({ ships: [ship] });
    await waitForMachine(
      getMachine(createContext(ship.id, { testId: "A" })),
      States.Idle
    );
  });
  it("will transition to done if new orders", async () => {
    const ship = createShip({ name: "B" });
    mockGetters({
      ships: [
        {
          ...ship,
          orders: [
            createOrder({ order: ShipOrders.Trade }),
            createOrder({ order: ShipOrders.Trade }),
          ],
        },
      ],
    });
    expect(shipCache.getShip(ship.id).name).toBe("B");
    await waitForMachine(
      getMachine(createContext(ship.id, { testId: "B" })),
      States.Done
    );
    expect(shipCache.getShip(ship.id).name).toBe("B");
  });
  it("will determineTradeRoute if no new orders", async () => {
    const ship = createShip({ name: "C" });
    mockGetters({
      ships: [{ ...ship, orders: [createOrder({ order: ShipOrders.Trade })] }],
    });
    expect(shipCache.getShip(ship.id).name).toBe("C");
    await waitForMachine(
      getMachine(createContext(ship.id, { testId: "C" })),
      States.DetermineTradeRoute
    );
    expect(shipCache.getShip(ship.id).name).toBe("C");
  });
});
