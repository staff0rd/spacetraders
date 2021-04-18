import { getGraph, getRoute } from "./graph";
import locations from "./graph.testdata.json";
import * as locationCache from "./locationCache";
import { Location } from "api/Location";

describe("routing", () => {
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
    it("should cater for no fuel", () => {
      const { graph, warps } = getGraph();
      console.log(graph.getLinksCount());
      let route = getRoute(graph, "OE-PM", "XV-CB-NM", "JW-MK-I", 50, warps);
      logRoute(route);
      expect(route.length).toBe(2);
    });

    it("should cater for no fuel - med", () => {
      const { graph, warps } = getGraph();
      let route = getRoute(graph, "OE-BO", "XV-CB-NM", "JW-MK-I", 50, warps);
      logRoute(route);
      expect(route.length).toBe(2);
    });

    it("should cater for no fuel - long", () => {
      const { graph, warps } = getGraph();
      let route = getRoute(graph, "OE-BO", "XV-TLF", "JW-MK-I", 50, warps);
      logRoute(route);
      expect(route.length).toBe(3);
    });
  });

  describe("warps", () => {
    it("should cater for no fuel", () => {
      const { graph, warps } = getGraph(false);
      console.log(graph.getLinksCount());
      let route = getRoute(graph, "OE-PM", "XV-CB-NM", "JW-MK-I", 50, warps);
      logRoute(route);
      expect(route.length).toBe(2);
    });

    it("should cater for no fuel - med", () => {
      const { graph, warps } = getGraph(false);
      let route = getRoute(graph, "OE-BO", "XV-CB-NM", "JW-MK-I", 50, warps);
      logRoute(route);
      expect(route.length).toBe(2);
    });

    it.only("should cater for no fuel - long", () => {
      const { graph, warps } = getGraph(false);
      let route = getRoute(graph, "OE-BO", "XV-TLF", "JW-MK-I", 50, warps);
      logRoute(route);
      expect(route.length).toBeGreaterThan(3);
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
