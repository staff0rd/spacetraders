import { Keys } from "./Keys";

export const getCredits = (): number => {
  return Number(localStorage.getItem(Keys.Credits) || "");
};

export const setCredits = (credits: number) => {
  localStorage.setItem(Keys.Credits, credits.toString());
};
