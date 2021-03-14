import { Middleware } from "redux";
import { newPlayerName } from "../newPlayerName";
import {
  getAvailableLoans,
  getLoans,
  getToken,
  requestNewLoan,
  setPlayer,
  startup,
} from "./gameSlice";
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
    const result = next(action);
    const token = getState().game.player?.token || "";
    const username = getState().game.player?.user?.username || "";

    const getStartupData = (state: RootState) => {
      dispatch(
        getLoans({
          token: state.game.player!.token,
          username: state.game.player!.user.username,
        })
      );
    };

    if (startup.match(action)) {
      const state = getState();
      if (!state.game.player) {
        dispatch(getToken(newPlayerName()));
      } else getStartupData(getState());
      return result;
    } else if (setPlayer.match(action)) {
      getStartupData(getState());
    } else if (getLoans.fulfilled.match(action)) {
      //if (!action.payload.loans.length) {
      dispatch(getAvailableLoans(token));
      // }
    }
    if (
      getAvailableLoans.fulfilled.match(action) &&
      !getState().game.loans.length
    ) {
      dispatch(
        requestNewLoan({ token, username, type: action.payload.loans[0].type })
      );
    }

    return result;
  };
};
