import db from "../../data";
import { IStrategy } from "../../data/Strategy/IStrategy";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";

export const updateStrategy = async (
  shipId: string,
  desired: ShipStrategy,
  current: IStrategy
) => {
  console.log(
    `Current strategy: ${ShipStrategy[current.strategy]}, desired: ${
      ShipStrategy[desired]
    }, ${desired}`
  );
  if (current.strategy === ShipStrategy.Change) {
    const persist = {
      shipId,
      strategy: current.data!.to.strategy,
      data: current.data!.to.data,
    };
    await db.strategies.put(persist);
  } else console.log("No update", ShipStrategy[desired]);
};
