import Dexie from "dexie";
import { IApiError } from "./IApiError";
import { ITrade } from "./ITrade";
import { IMarket } from "./IMarket";
import { IShipStrategy } from "./Strategy/IShipStrategy";
import { IIntel } from "./IIntel";
import { ILocationScout } from "./ILocationScout";

class Database extends Dexie {
  apiErrors: Dexie.Table<IApiError, number>; // number = type of the primkey
  trades: Dexie.Table<ITrade, number>;
  markets: Dexie.Table<IMarket, number>;
  strategies: Dexie.Table<IShipStrategy, string>;
  intel: Dexie.Table<IIntel, string>;
  locationScouts: Dexie.Table<ILocationScout, string>;

  constructor() {
    super("Database");
    this.version(25).stores({
      apiErrors: "++id, code",
      trades: "++id, good, shipId, location, type",
      market: "++id,location,good",
      strategies: "&shipId",
      intel: "&shipId,username",
      locationScouts: "&location",
    });
    // The following line is needed if your typescript
    // is compiled using babel instead of tsc:
    this.apiErrors = this.table("apiErrors");
    this.trades = this.table("trades");
    this.markets = this.table("market");
    this.strategies = this.table("strategies");
    this.intel = this.table("intel");
    this.locationScouts = this.table("locationScouts");
  }
}

function handler(event: PromiseRejectionEvent) {
  event.preventDefault(); // Prevents default handler (would log to console).
  let reason = event.reason;
  console.warn(
    "Unhandled promise rejection:",
    reason && (reason.stack || reason)
  );
}

window.addEventListener("unhandledrejection", handler);

const db = new Database();

export default db;
