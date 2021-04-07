import { IStrategy } from "./IStrategy";

export type ChangeStrategyPayload = {
  from: IStrategy;
  to: IStrategy;
};
