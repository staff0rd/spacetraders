import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as api from "../api";
import { AvailableLoan } from "../api/AvailableLoan";
import { LoanType } from "../api/LoanType";
import { Player } from "./Player";

type Game = {
  player?: Player;
  loans: AvailableLoan[];
  availableLoans: AvailableLoan[];
};

const getPlayer = () => {
  const player = window.localStorage.getItem("player");
  if (player) return JSON.parse(player) as Player;
};

const initialState = { loans: [], availableLoans: [] } as Game;

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
    builder.addCase(getToken.fulfilled, (state, action) => {
      localStorage.setItem("player", JSON.stringify(action.payload));
      return {
        ...state,
        player: {
          ...action.payload,
        },
      };
    });
    builder.addCase(getToken.rejected, (state, action) => {
      handleRejection(action.payload);
    });
    builder.addCase(getAvailableLoans.fulfilled, (state, action) => {
      console.warn(action.payload);
      return {
        ...state,
        availableLoans: action.payload.loans,
      };
    });
    builder.addCase(getLoans.fulfilled, (state, action) => {
      console.warn("getLoans", action.payload);
      return {
        ...state,
        loans: action.payload.loans,
      };
    });
    builder.addCase(requestNewLoan.fulfilled, (state, action) => {
      console.warn("requestNewLoan-fulfilled", action.payload);
    });
    builder.addCase(requestNewLoan.rejected, (state, action) => {
      console.warn("requestNewLoan-rejected", action.payload);
    });

    builder.addCase(getAvailableLoans.rejected, (state, action) =>
      handleRejection(action.payload)
    );
  },
});

export const { setPlayer, startup } = gameSlice.actions;

export default gameSlice.reducer;

const handleRejection = (payload: any) => {
  console.error("rejected", payload);
};
