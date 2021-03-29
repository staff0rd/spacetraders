import Dexie from "dexie";
import { IApiError } from "./IApiError";
import { ITrade } from "./ITrade";
import { IMarket } from "./IMarket";
import { IShipStrategy } from "./IShipStrategy";

class Database extends Dexie {
  apiErrors: Dexie.Table<IApiError, number>; // number = type of the primkey
  trades: Dexie.Table<ITrade, number>;
  markets: Dexie.Table<IMarket, number>;
  strategies!: Dexie.Table<IShipStrategy, number>;

  constructor() {
    super("Database");
    this.version(14).stores({
      apiErrors: "++id, code",
      trades: "++id, good, shipId, location, type",
      market: "++id,location,good",
      strategies: "&shipId",
      strategy: null,
    });
    // The following line is needed if your typescript
    // is compiled using babel instead of tsc:
    this.apiErrors = this.table("apiErrors");
    this.trades = this.table("trades");
    this.markets = this.table("market");
    this.strategies = this.table("strategies");
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
