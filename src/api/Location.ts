import { Marketplace } from "./Marketplace";
import { Ship } from "./Ship";
import { Structure } from "./Structure";

export interface Location {
  symbol: string;
  type: string;
  name: string;
  x: number;
  y: number;
  ships: Ship[];
  anomaly?: string;
  marketplace?: Marketplace[];
  messages?: string[];
  structures?: Structure[];
}

export const hasGood = (location: Location, good: string) =>
  location.marketplace?.find((p) => p.symbol === good)?.quantityAvailable || 0;
