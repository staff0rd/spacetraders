import { Marketplace } from "./Marketplace";
import { Ship } from "./Ship";

export interface Location {
  symbol: string;
  type: string;
  name: string;
  x: number;
  y: number;
  ships: Ship[];
  anomaly?: string;
  marketplace: Marketplace[];
}
