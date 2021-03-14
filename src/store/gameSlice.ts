import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as api from "../api";
import { Player } from "./Player";

type Game = {
  player?: Player;
};

const getPlayer = () => {
  const player = window.localStorage.getItem("player");
  console.log("result", player);
  if (player) return JSON.parse(player) as Player;
};

const initialState = {} as Game;

export const getToken = createAsyncThunk(
  "getToken",
  async (userName: string, thunkAPI) => {
    const response = await api.getToken(userName);
    return response;
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
      console.error("rejected", action.payload);
    });
  },
});

export const { setPlayer, startup } = gameSlice.actions;

export default gameSlice.reducer;
