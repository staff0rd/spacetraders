export interface IMarket {
  id?: number;
  location: string;
  good: string;
  volumePerUnit: number;
  pricePerUnit: number;
  quantityAvailable: number;
  created: string;
}
