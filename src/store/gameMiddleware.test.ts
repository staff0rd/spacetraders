import { startup } from "./gameSlice";
import { createStore } from "./store";

jest.mock("../api", () => ({
  getToken: () => ({
    user: {},
    token: "123",
  }),
}));

function wait(ms: number = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe.only("gameMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should create new player if one does not exist", async () => {
    const store = createStore();
    store.dispatch(startup());
    await wait();
    const state = store.getState();
    expect(state.game.player!.token).toBe("123");
  });
  it("should use cached player", async () => {
    jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => JSON.stringify({ token: "hi!" }));
    const store = createStore();
    store.dispatch(startup());
    await wait();
    const state = store.getState();
    expect(state.game.player!.token).toBe("hi!");
  });
});
