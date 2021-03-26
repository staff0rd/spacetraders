import { Marketplace } from "../api/Marketplace";

export interface IMarket {
  id?: number;
  market: Marketplace[];
  location: string;
  created: string;
}
