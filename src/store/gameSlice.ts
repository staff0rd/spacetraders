import {
  AsyncThunk,
  CaseReducer,
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import * as api from "../api";
import { AvailableLoan } from "../api/AvailableLoan";
import { AvailableShip } from "../api/AvailableShip";
import { Loan } from "../api/Loan";
import { LoanType } from "../api/LoanType";
import { Ship } from "../api/Ship";
import { Player } from "./Player";

type Game = {
  player?: Player;
  loans: Loan[];
  ships: Ship[];
  availableLoans: AvailableLoan[];
  availableShips: AvailableShip[];
};

const getPlayer = () => {
  const player = window.localStorage.getItem("player");
  if (player) return JSON.parse(player) as Player;
};

const initialState = {
  loans: [],
  availableLoans: [],
  availableShips: [],
  ships: [],
} as Game;

export const getToken = createAsyncThunk(
  "getToken",
  async (username: string) => {
    const response = await api.getToken(username);
    return response;
  }
);

export const getAvailableLoans = createAsyncThunk(
  "getAvailableLoans",
  async (token: string) => {
    return await api.getAvailableLoans(token);
  }
);

export const getAvailableShips = createAsyncThunk(
  "getAvailableShips",
  async (token: string) => {
    return await api.getAvailableShips(token);
  }
);

type RequestNewLoanParams = UserParams & { type: LoanType };

export const requestNewLoan = createAsyncThunk(
  "requestNewLoan",
  async ({ token, username, type }: RequestNewLoanParams) => {
    return await api.requestNewLoan(token, username, type);
  }
);

type BuyShipParams = UserParams & { type: string; location: string };

export const buyShip = createAsyncThunk(
  "buyShip",
  async ({ token, username, type, location }: BuyShipParams) => {
    return await api.buyShip(token, username, location, type);
  }
);

type UserParams = {
  token: string;
  username: string;
};
export const getLoans = createAsyncThunk(
  "getLoans",
  async ({ token, username }: UserParams) => {
    return await api.getLoans(token, username);
  }
);

export const getShips = createAsyncThunk(
  "getShips",
  async ({ token, username }: UserParams) => {
    return await api.getShips(token, username);
  }
);

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setPlayer: (state, action: PayloadAction<Player>) => ({
      ...state,
      player: action.payload,
    }),
    startup: (state) => {
      const player = getPlayer();
      if (player) return { ...state, player };
      return state;
    },
  },
  extraReducers: (builder) => {
    const reduceThunk = <Returned, ThunkArg>(
      thunk: AsyncThunk<Returned, ThunkArg, {}>,
      fulfilledCaseReducer:
        | CaseReducer<Game, PayloadAction<Returned, string, {}>>
        | undefined = undefined,
      fulfilledPayloadLogConverter = (payload: Returned) => payload
    ) => {
      builder.addCase(thunk.pending, (state, action) => {
        console.log(`${thunk.typePrefix}-pending`);
      });
      builder.addCase(thunk.fulfilled, (state, action) => {
        console.log(
          `${thunk.typePrefix}-fulfilled`,
          JSON.stringify(fulfilledPayloadLogConverter(action.payload), null, 2)
        );
        if (fulfilledCaseReducer) return fulfilledCaseReducer(state, action);
      });
      builder.addCase(thunk.rejected, (state, action) => {
        handleRejection(
          thunk.typePrefix,
          JSON.stringify(action.payload, null, 2)
        );
      });
    };

    reduceThunk(getToken, (state, action) => {
      localStorage.setItem("player", JSON.stringify(action.payload));
      return {
        ...state,
        player: {
          ...action.payload,
        },
      };
    });
    reduceThunk(requestNewLoan);
    reduceThunk(buyShip);
    reduceThunk(getAvailableLoans, (state, action) => ({
      ...state,
      availableLoans: action.payload.loans,
    }));
    reduceThunk(getLoans, (state, action) => ({
      ...state,
      loans: action.payload.loans,
    }));
    reduceThunk(getShips, (state, action) => ({
      ...state,
      ships: action.payload.ships,
    }));
    reduceThunk(
      getAvailableShips,
      (state, action) => ({
        ...state,
        availableShips: action.payload.ships.sort(
          (a, b) => a.purchaseLocations[0].price - b.purchaseLocations[0].price
        ),
      }),
      (p) => ({
        ships: p.ships.sort(
          (a, b) => a.purchaseLocations[0].price - b.purchaseLocations[0].price
        ),
      })
    );
  },
});

export const { setPlayer, startup } = gameSlice.actions;

export default gameSlice.reducer;

const handleRejection = (name: string, payload: any) => {
  console.warn(`${name}-rejected`, payload);
};
