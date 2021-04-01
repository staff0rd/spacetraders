import { newShipName } from "./data/names";

describe("name generator", () => {
  it("should generate a name", () => {
    expect(newShipName()).toBe("hi");
  });
});
