import locations from "./graph.locations.testdata.json";
import { getWormholes, getSystems } from "./graph";

describe("graph.getWormholes", () => {
  it("should return warps without dupes", () => {
    const systems = getSystems(locations);
    const warps = getWormholes(systems, locations);
    const count = warps.map((w) => w.symbol).filter((w) => w === "OE-W-XV")
      .length;
    expect(count).toBe(1);
  });
  it("should return all warps", () => {
    const systems = getSystems(locations);
    const warps = getWormholes(systems, locations);
    expect(warps.length).toBe(6);
  });
  it("should call callback for each connected", () => {
    const systems = getSystems(locations);
    const callback = jest.fn();
    getWormholes(systems, locations, callback);
    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: "OE-W-XV" }),
      expect.objectContaining({ symbol: "XV-W-OE" })
    );
  });
});
