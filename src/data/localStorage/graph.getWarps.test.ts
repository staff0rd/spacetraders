import locations from "./graph.locations.testdata.json";
import { getWarps, getSystems } from "./graph";

describe("graph.getWarps", () => {
  it("should return warps without dupes", () => {
    const systems = getSystems(locations);
    const warps = getWarps(systems, locations);
    const count = warps.map((w) => w.symbol).filter((w) => w === "OE-W-XV")
      .length;
    expect(count).toBe(1);
  });
  it("should return all warps", () => {
    const systems = getSystems(locations);
    const warps = getWarps(systems, locations);
    expect(warps.length).toBe(6);
  });
});
