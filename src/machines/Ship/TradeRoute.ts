export type TradeRoute = {
  good: string;
  buyLocation: string;
  purchasePricePerUnit: number;
  sellLocation: string;
  sellPricePerUnit: number;
  distance: number;
  volume: number;
  profitPerUnit: number;
  totalProfit: number;
  costVolumeDistance: number;
  quantityAvailable: number;
  quantityToBuy: number;
  fuelNeeded: number;
};
