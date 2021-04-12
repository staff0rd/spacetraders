const key = "credits";

export const getCredits = (): number => {
  return Number(localStorage.getItem(key) || "");
};

export const setCredits = (credits: number) => {
  localStorage.setItem(key, credits.toString());
};
