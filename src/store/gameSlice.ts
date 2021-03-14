import {
  AsyncThunk,
  CaseReducer,
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import * as api from "../api";
import { AvailableShip } from "../api";
import { AvailableLoan } from "../api/AvailableLoan";
import { LoanType } from "../api/LoanType";
import { Player } from "./Player";

type Game = {
  player?: Player;
  loans: AvailableLoan[];
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

type RequestNewLoanParams = GetLoansParams & { type: LoanType };

export const requestNewLoan = createAsyncThunk(
  "requestNewLoan",
  async ({ token, username, type }: RequestNewLoanParams) => {
    return await api.requestNewLoan(token, username, type);
  }
);

type GetLoansParams = {
  token: string;
  username: string;
};
export const getLoans = createAsyncThunk(
  "getLoans",
  async ({ token, username }: GetLoansParams) => {
    return await api.getLoans(token, username);
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
      fulfilledCaseReducer: CaseReducer<Game> | undefined = undefined
    ) => {
      builder.addCase(thunk.pending, (state, action) => {
        console.log(`${thunk.typePrefix}-pending`);
      });
      builder.addCase(thunk.fulfilled, (state, action) => {
        console.log(
          `${thunk.typePrefix}-fulfilled`,
          JSON.stringify(action.payload, null, 2)
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
    reduceThunk(getAvailableLoans, (state, action) => ({
      ...state,
      availableLoans: action.payload.loans,
    }));
    reduceThunk(getLoans, (state, action) => ({
      ...state,
      loans: action.payload.loans,
    }));
  },
});

export const { setPlayer, startup } = gameSlice.actions;

export default gameSlice.reducer;

const handleRejection = (name: string, payload: any) => {
  console.warn(`${name}-rejected`, payload);
};
