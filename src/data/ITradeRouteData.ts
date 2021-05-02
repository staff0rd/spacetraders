import { TradeRoute } from "../machines/Ship/TradeRoute";
import { Trade } from "./ITrade";

export interface ITradeRouteData {
  id?: number;
  created: string;
  updated: string;
  shipId: string;
  tradeRoute: TradeRoute;
  trades: Trade[];
  profit: number;
  timeTaken: number;
  complete: number;
}
