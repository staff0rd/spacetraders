import { Middleware } from "redux";
import { newPlayerName } from "../newPlayerName";
import {
  buyShip,
  getAvailableLoans,
  getAvailableShips,
  getLoans,
  getMarket,
  getShips,
  getSystems,
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

    const getStartupData = () => {
      dispatch(
        getLoans({
          token,
          username,
        })
      );
      dispatch(
        getShips({
          token,
          username,
        })
      );
      dispatch(getSystems(token));
    };

    if (startup.match(action)) {
      const state = getState();
      if (!state.game.player) {
        dispatch(getToken(newPlayerName()));
      } else getStartupData();
      return result;
    } else if (setPlayer.match(action)) {
      getStartupData();
    } else if (getLoans.fulfilled.match(action)) {
      if (!action.payload.loans.length) {
        dispatch(getAvailableLoans(token));
      }
    } else if (getShips.fulfilled.match(action)) {
      if (!action.payload.ships.length) {
        dispatch(getAvailableShips(token));
      }
    } else if (getSystems.fulfilled.match(action)) {
      const symbol = action.payload.systems[0].locations[0].symbol;
      dispatch(getMarket({ token, symbol }));
    }

    // TODO: buy loan logic?
    if (
      getAvailableLoans.fulfilled.match(action) &&
      !getState().game.loans.length
    ) {
      dispatch(
        requestNewLoan({ token, username, type: action.payload.loans[0].type })
      );
    }

    // TODO: buy ship logic?
    if (
      getAvailableShips.fulfilled.match(action) &&
      !getState().game.ships.length
    ) {
      console.log("not ordered", action.payload.ships);
      const orderedShips = [...action.payload.ships].sort(
        (a, b) => a.purchaseLocations[0].price - b.purchaseLocations[0].price
      );
      console.log("ordered", JSON.stringify(orderedShips));
      const cheapestShip = orderedShips[0];

      dispatch(
        buyShip({
          token,
          username,
          type: cheapestShip.type,
          location: cheapestShip.purchaseLocations[0].location,
        })
      );
    }

    return result;
  };
};
