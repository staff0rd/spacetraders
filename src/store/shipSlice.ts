import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Ship } from "../api/Ship";

type ShipInstructions = Ship & {
  instructions: string[];
};

const initialState: ShipInstructions[] = [];

const shipSlice = createSlice({
  name: "ship",
  initialState,
  reducers: {
    instructShip: (state, action: PayloadAction<string>) => {},
    updateShip: (state, action: PayloadAction<Ship>) => {
      console.warn("updateShip", action.payload);
      return [
        ...state.filter((s) => s.id !== action.payload.id),
        {
          ...action.payload,
          instructions:
            state.find((s) => s.id === action.payload.id)?.instructions ?? [],
        },
      ];
    },
  },
});

export const { instructShip, updateShip } = shipSlice.actions;

export default shipSlice.reducer;
