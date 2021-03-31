export interface IMarket {
  id?: number;
  location: string;
  good: string;
  volumePerUnit: number;
  sellPricePerUnit: number;
  purchasePricePerUnit: number;
  quantityAvailable: number;
  created: string;
}
