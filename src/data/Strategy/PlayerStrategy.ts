import { ShipStrategy } from "./ShipStrategy";
import { DateTime } from "luxon";

type PlayerStrategy = {
  strategy: ShipStrategy;
  data: any;
  since: string;
};

export const setPlayerStrategy = (newStrategy: ShipStrategy, data?: any) => {
  localStorage.setItem(
    "strategy",
    JSON.stringify({
      strategy: newStrategy,
      since: DateTime.now().toISO(),
      data,
    } as PlayerStrategy)
  );
};

export const getPlayerStrategy = (): PlayerStrategy => {
  const result = localStorage.getItem("strategy");
  if (!result) {
    setPlayerStrategy(ShipStrategy.Trade, undefined);
    return getPlayerStrategy();
  }
  return JSON.parse(result);
};
