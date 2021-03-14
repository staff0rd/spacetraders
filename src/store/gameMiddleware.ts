import { Middleware } from "redux";
import { newPlayerName } from "../newPlayerName";
import { getToken, startup } from "./gameSlice";
import { RootState } from "./rootReducer";
import { AppDispatch } from "./store";

type MiddlewareProps = {
  dispatch: AppDispatch;
  getState: () => RootState;
};

export const gameMiddleware: Middleware<
  {}, // legacy type parameter added to satisfy interface signature
  RootState
> = ({ getState, dispatch }: MiddlewareProps) => {
  return (next) => (action) => {
    if (startup.match(action)) {
      const result = next(action);
      const state = getState();
      if (!state.game.player) {
        const playerName = newPlayerName();
        const action = getToken(playerName);
        dispatch(action);
      }
      return result;
    }
    return next(action);
  };
};
