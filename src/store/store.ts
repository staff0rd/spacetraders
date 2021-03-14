import { configureStore } from "@reduxjs/toolkit";
import { gameMiddleware } from "./gameMiddleware";
import { rootReducer } from "./rootReducer";

export const createStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(gameMiddleware),
  });

export const store = createStore();

if (process.env.NODE_ENV === "development" && module.hot) {
  module.hot.accept("./rootReducer", () => {
    const newRootReducer = require("./rootReducer").default;
    store.replaceReducer(newRootReducer);
  });
}

export type AppDispatch = typeof store.dispatch;
