import { createAsyncThunk } from "@reduxjs/toolkit";

export const wrappedThunk = <T1, T2>(
  name: string,
  getPromise: (p: T1) => Promise<T2>
) => {
  return createAsyncThunk(name, async (payload: T1, { rejectWithValue }) => {
    return await errorWrapper(getPromise(payload), rejectWithValue);
  });
};
const errorWrapper = async <T>(
  promise: Promise<T>,
  rejectWithValue: (value: unknown) => any
) => {
  try {
    return await promise;
  } catch (e) {
    return rejectWithValue({ message: e.message }) as Promise<T>;
  }
};
