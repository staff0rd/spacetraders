import { IStrategy } from "./IStrategy";

export type ChangePayload = {
  from: IStrategy;
  to: IStrategy;
};
