import { fromLocation, toLocation, testShip, testGood } from "./objectMother";
import { determineCargo } from "./determineCargo";
import { MarketContext } from "./MarketContext";

const context = () => ({
  token: "123",
  username: "username",
  ship: {
    ...testShip,
    cargo: [],
    spaceAvailable: 100,
  },
  locations: [fromLocation, toLocation],
  destination: "TO",
  credits: 100,
});

describe("determineCargo", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  it("should buy nothing if no destination market", async () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(
      JSON.stringify({
        FROM: fromLocation,
        TO: { ...toLocation, marketplace: [] },
      })
    );

    const result = await determineCargo(context());

    expect(result.good).toBe("NONE");
  });

  it("should buy nothing if can't sell at destination", async () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(
      JSON.stringify({
        FROM: { ...fromLocation, marketplace: [testGood("A")] },
        TO: {
          ...toLocation,
          marketplace: [testGood("B")],
        },
      } as MarketContext)
    );
    const result = await determineCargo(context());

    expect(result.good).toBe("NONE");
  });

  it("should buy nothing if no profit", async () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(
      JSON.stringify({
        FROM: { ...fromLocation, marketplace: [testGood("A")] },
        TO: {
          ...toLocation,
          marketplace: [testGood("A")],
        },
      } as MarketContext)
    );
    const result = await determineCargo(context());

    expect(result.good).toBe("NONE");
  });
  it("should buy nothing if negative profit", async () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(
      JSON.stringify({
        FROM: { ...fromLocation, marketplace: [testGood("A", 2)] },
        TO: {
          ...toLocation,
          marketplace: [testGood("A")],
        },
      } as MarketContext)
    );
    const result = await determineCargo(context());

    expect(result.good).toBe("NONE");
  });

  it("should fill space available", async () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(
      JSON.stringify({
        FROM: { ...fromLocation, marketplace: [testGood("A")] },
        TO: {
          ...toLocation,
          marketplace: [testGood("A", 2)],
        },
      } as MarketContext)
    );

    const result = await determineCargo(context());

    expect(result.good).toBe("A");
    expect(result.quantity).toBe(100);
  });

  it("should buy for best profit", async () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(
      JSON.stringify({
        FROM: {
          ...fromLocation,
          marketplace: [testGood("A"), testGood("B"), testGood("C")],
        },
        TO: {
          ...toLocation,
          marketplace: [testGood("A"), testGood("B"), testGood("C", 2)],
        },
      } as MarketContext)
    );
    const result = await determineCargo(context());

    expect(result.good).toBe("C");
  });

  it("should buy for smallest volume, after profit", async () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(
      JSON.stringify({
        FROM: {
          ...fromLocation,
          marketplace: [
            testGood("A", 1, 400, 2),
            testGood("B", 1, 400, 2),
            testGood("C", 1, 400, 1),
          ],
        },
        TO: {
          ...toLocation,
          marketplace: [testGood("A", 2), testGood("B", 2), testGood("C", 2)],
        },
      } as MarketContext)
    );
    const result = await determineCargo(context());

    expect(result.good).toBe("C");
  });

  it("should not buy more than credits available", async () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(
      JSON.stringify({
        FROM: {
          ...fromLocation,
          marketplace: [testGood("A", 50, 200, 1)],
        },
        TO: {
          ...toLocation,
          marketplace: [testGood("A", 100)],
        },
      } as MarketContext)
    );
    const result = await determineCargo(context());

    expect(result.quantity).toBe(2);
  });

  it("should not buy more than quantity available", async () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(
      JSON.stringify({
        FROM: {
          ...fromLocation,
          marketplace: [testGood("A", 1, 50, 1)],
        },
        TO: {
          ...toLocation,
          marketplace: [testGood("A", 2)],
        },
      } as MarketContext)
    );
    const result = await determineCargo(context());

    expect(result.quantity).toBe(50);
  });
});
