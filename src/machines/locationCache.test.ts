import { MarketContext } from "./MarketContext";
import { cacheLocation } from "./locationCache";

describe("locationCache", () => {
  it.only("should cache new location", () => {
    expect(() => {
      cacheLocation({
        marketplace: [],
        name: "Some location",
        ships: [],
        symbol: "SL",
        type: "PLANET",
        x: 1,
        y: 2,
      });
    }).not.toThrow();
  });
});
