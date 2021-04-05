import Dexie from "dexie";
import { IApiError } from "./IApiError";
import { ITrade } from "./ITrade";
import { IMarket, IMarketNow as IGoodLocation } from "./IMarket";
import { IShipStrategy } from "./Strategy/IShipStrategy";
import { IIntel } from "./IIntel";
import { IProbe } from "./IProbe";
import { IShip } from "./IShip";
import { ITradeRoute } from "./ITradeRoute";
import { FlightPlan } from "../api/FlightPlan";

class Database extends Dexie {
  apiErrors: Dexie.Table<IApiError, number>; // number = type of the primkey
  trades: Dexie.Table<ITrade, number>;
  markets: Dexie.Table<IMarket, number>;
  goodLocation: Dexie.Table<IGoodLocation, string>;
  strategies: Dexie.Table<IShipStrategy, string>;
  intel: Dexie.Table<IIntel, string>;
  probes: Dexie.Table<IProbe, string>;
  shipNames: Dexie.Table<IShip, string>;
  tradeRoutes: Dexie.Table<ITradeRoute, number>;
  flightPlans: Dexie.Table<FlightPlan, string>;

  constructor() {
    super("Database");
    this.version(41).stores({
      apiErrors: "++id, code",
      trades: "++id, good, shipId, location, type, timestamp",
      market: "++id,location,good,created",
      goodLocation: "[location+good], created",
      strategies: "&shipId",
      intel: "&shipId,username",
      probes: "&location,shipId",
      shipNames: "&shipId, name",
      tradeRoutes: "++id, shipId",
      flightPlans: "shipId",
    });
    // The following line is needed if your typescript
    // is compiled using babel instead of tsc:
    this.apiErrors = this.table("apiErrors");
    this.trades = this.table("trades");
    this.markets = this.table("market");
    this.strategies = this.table("strategies");
    this.intel = this.table("intel");
    this.probes = this.table("probes");
    this.shipNames = this.table("shipNames");
    this.goodLocation = this.table("goodLocation");
    this.tradeRoutes = this.table("tradeRoutes");
    this.flightPlans = this.table("flightPlans");
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
