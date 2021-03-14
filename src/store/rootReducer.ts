import { combineReducers } from "@reduxjs/toolkit";
import gameReducer from "./gameSlice";

export const rootReducer = combineReducers({
  game: gameReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
