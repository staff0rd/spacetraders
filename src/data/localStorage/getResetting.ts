import { Keys } from "./Keys";

export const getResetting = () => {
  const value = localStorage.getItem(Keys.Resetting);
  return (value ?? "false") === "true";
};

export const setResetting = (value: boolean) =>
  localStorage.setItem(Keys.Resetting, value.toString());
