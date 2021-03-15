import { Middleware } from "redux";
import { newPlayerName } from "../newPlayerName";
import {
  buyShip,
  getAvailableLoans,
  getAvailableShips,
  getFlightPlans,
  getLoans,
  getMarket,
  getShips,
  getSystems,
  getToken,
  newFlightPlan,
  purchaseOrder,
  requestNewLoan,
  setPlayer,
  startup,
} from "./gameSlice";
import { RootState } from "./rootReducer";
import { updateShip } from "./shipSlice";
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
    const state = getState();
    const fuel =
      state.game.ships[0]?.cargo.filter((c) => c.good === "FUEL").length ?? 0;

    const getStartupData = () => {
      dispatch(getSystems(token));
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
    };

    if (startup.match(action)) {
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
      } else {
        dispatch(updateShip(action.payload.ships[0]));

        // if (state.game.ships[0].spaceAvailable) {
        //   dispatch(getMarket({ token, symbol: state.game.ships[0].location }));
        // } else {
        //   dispatch(
        //     newFlightPlan({
        //       token,
        //       username,
        //       shipId: state.game.ships[0].id,
        //       destination: "OE-PM",
        //     })
        //   );
        // }
      }
    } else if (getMarket.fulfilled.match(action)) {
      // dispatch(
      //   purchaseOrder({
      //     token,
      //     username,
      //     good: "METALS",
      //     quantity: state.game.ships[0].spaceAvailable,
      //     shipId: state.game.ships[0].id,
      //   })
      // );
      // dispatch(getFlightPlans({ token, symbol: state.game.systems[0].symbol }));
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
      const orderedShips = [...action.payload.ships].sort(
        (a, b) => a.purchaseLocations[0].price - b.purchaseLocations[0].price
      );
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
