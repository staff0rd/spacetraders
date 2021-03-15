import { combineReducers } from "@reduxjs/toolkit";
import gameReducer from "./gameSlice";
import shipReducer from "./shipSlice";

export const rootReducer = combineReducers({
  game: gameReducer,
  ships: shipReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
