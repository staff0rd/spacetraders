import db from "./";

export const getStrategies = () => db.strategies.toArray();
