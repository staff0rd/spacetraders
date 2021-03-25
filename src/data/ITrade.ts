export enum TradeType {
  Buy,
  Sell,
}

export interface ITrade {
  id?: number;
  shipId: string;
  type: TradeType;
  good: string;
  quantity: number;
  cost: number;
  profit?: number;
  location?: string;
  timestamp: string;
}
