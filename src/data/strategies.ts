import db from "./";

export const getStrategies = () => db.strategies.toArray();

export const getStrategy = (shipId: string) =>
  db.strategies.where({ shipId }).first();
