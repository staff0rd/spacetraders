export enum TradeType {
  Buy,
  Sell,
}

export interface ITrade extends Trade {
  id?: number;
  shipId: string;
  profit?: number;
}

export interface Trade {
  good: string;
  type: TradeType;
  quantity: number;
  cost: number;
  location: string;
  timestamp: string;
}
