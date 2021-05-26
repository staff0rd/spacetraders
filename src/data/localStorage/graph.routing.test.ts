import { getGraph, getRoute } from "./graph";
import locations from "./graph.testdata.json";
import * as locationCache from "./locationCache";
import { Location } from "api/Location";

describe.skip("routing", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest
      .spyOn(Storage.prototype, "getItem")
      .mockReturnValue(JSON.stringify(locations));
  });

  describe("locations", () => {
    it("should have correct locations", () => {
      const a = locationCache.getLocations();
      expect(a.length).toBe(21);
    });
  });

  describe("fuel (skip warps)", () => {
    it("should cater for no fuel - from entry warp", () => {
      const { graph, warps } = getGraph();
      let route = getRoute(
        graph,
        "OE-XV-91-2",
        "XV-CB-NM",
        { maxCargo: 50, type: "JW-MK-I", speed: 1 },
        warps
      );
      logRoute(route);
      expect(route.length).toBe(2);
    });

    it("should cater for no fuel - from exit warp", () => {
      const { graph, warps } = getGraph();
      let route = getRoute(
        graph,
        "XV-OE-2-91",
        "XV-CB-NM",
        { maxCargo: 50, type: "JW-MK-I", speed: 1 },
        warps
      );
      logRoute(route);
      expect(route.length).toBe(1);
    });
    it("should cater for no fuel", () => {
      const { graph, warps } = getGraph();
      let route = getRoute(
        graph,
        "OE-PM",
        "XV-CB-NM",
        { maxCargo: 50, type: "JW-MK-I", speed: 1 },
        warps
      );
      logRoute(route);
      expect(route.length).toBe(4);
    });

    it("should cater for no fuel - med", () => {
      const { graph, warps } = getGraph();
      let route = getRoute(
        graph,
        "OE-BO",
        "XV-CB-NM",
        { maxCargo: 50, type: "JW-MK-I", speed: 1 },
        warps
      );
      logRoute(route);
      expect(route.length).toBe(4);
    });

    it("should cater for no fuel - long", () => {
      const { graph, warps } = getGraph();
      let route = getRoute(
        graph,
        "OE-BO",
        "XV-TLF",
        { maxCargo: 50, type: "JW-MK-I", speed: 1 },
        warps
      );
      logRoute(route);
      expect(route.length).toBe(5);
    });
  });
});

function logRoute(
  route: {
    from: Location;
    to: Location;
    fuelNeeded: number;
    fuelAvailable: number;
  }[]
) {
  console.log(
    route.map((r) => ({
      ...r,
      from: r.from.symbol,
      to: r.to.symbol,
    }))
  );
}
