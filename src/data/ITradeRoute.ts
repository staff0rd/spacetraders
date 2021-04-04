import { TradeRoute } from "../machines/Ship/TradeRoute";

export interface ITradeRoute extends TradeRoute {
  id?: number;
  created: string;
  shipId: string;
}
