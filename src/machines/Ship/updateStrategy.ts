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
    }`
  );
  if (current.strategy === ShipStrategy.Change) {
    await db.strategies.put({
      shipId,
      strategy: current.data!.to.strategy,
      data: current.data!.to.data,
    });
  } else console.log("No update", ShipStrategy[desired]);
};
