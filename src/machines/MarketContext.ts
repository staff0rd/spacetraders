import { Location } from "../api/Location";

export type MarketContext = {
  [key: string]: Location;
};

export type SystemContext = {
  [system: string]: MarketContext;
};
