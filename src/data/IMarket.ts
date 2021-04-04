export interface IMarketNow {
  location: string;
  good: string;
  volumePerUnit: number;
  sellPricePerUnit: number;
  purchasePricePerUnit: number;
  quantityAvailable: number;
  created: string;
  x: number;
  y: number;
  type: string;
}

export interface IMarket extends IMarketNow {
  id?: number;
}
