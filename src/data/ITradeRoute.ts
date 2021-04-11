import { TradeRoute } from "../machines/Ship/TradeRoute";

export interface ITradeRoute extends TradeRoute {
  created: string;
  shipId: string;
}
