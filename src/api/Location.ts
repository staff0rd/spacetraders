import { Ship } from "./Ship";

export interface Marketplace {
  symbol: string;
  volumePerUnit: number;
  pricePerUnit: number;
  quantityAvailable: number;
}

export interface Location {
  symbol: string;
  type: string;
  name: string;
  x: number;
  y: number;
  ships: Ship[];
  anomaly: string;
  marketplace: Marketplace[];
}
