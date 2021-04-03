import Dexie from "dexie";
import { IApiError } from "./IApiError";
import { ITrade } from "./ITrade";
import { IMarket } from "./IMarket";
import { IShipStrategy } from "./Strategy/IShipStrategy";
import { IIntel } from "./IIntel";
import { IProbe } from "./IProbe";
import { IShip } from "./IShip";

class Database extends Dexie {
  apiErrors: Dexie.Table<IApiError, number>; // number = type of the primkey
  trades: Dexie.Table<ITrade, number>;
  markets: Dexie.Table<IMarket, number>;
  strategies: Dexie.Table<IShipStrategy, string>;
  intel: Dexie.Table<IIntel, string>;
  probes: Dexie.Table<IProbe, string>;
  ships: Dexie.Table<IShip, string>;

  constructor() {
    super("Database");
    this.version(33).stores({
      apiErrors: "++id, code",
      trades: "++id, good, shipId, location, type, timestamp",
      market: "++id,location,good,created",
      strategies: "&shipId",
      intel: "&shipId,username",
      probes: "&location,shipId",
      ships: "&shipId, name",
    });
    // The following line is needed if your typescript
    // is compiled using babel instead of tsc:
    this.apiErrors = this.table("apiErrors");
    this.trades = this.table("trades");
    this.markets = this.table("market");
    this.strategies = this.table("strategies");
    this.intel = this.table("intel");
    this.probes = this.table("probes");
    this.ships = this.table("ships");
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
