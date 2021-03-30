import { ShipStrategy } from "./ShipStrategy";
import { DateTime } from "luxon";

type PlayerStrategy = {
  strategy: ShipStrategy;
  since: string;
};

export const setPlayerStrategy = (newStrategy: ShipStrategy) => {
  localStorage.setItem(
    "strategy",
    JSON.stringify({
      strategy: newStrategy,
      since: DateTime.now().toISO(),
    } as PlayerStrategy)
  );
};

export const getPlayerStrategy = (): PlayerStrategy => {
  const result = localStorage.getItem("strategy");
  if (!result) {
    setPlayerStrategy(ShipStrategy.Trade);
    return getPlayerStrategy();
  }
  return JSON.parse(result);
};
