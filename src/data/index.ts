import Dexie from "dexie";
import { IApiError } from "./IApiError";
import { ITrade } from "./ITrade";
import { IMarket, IMarketNow as IGoodLocation } from "./IMarket";
import { IShipStrategy } from "./Strategy/IShipStrategy";
import { IIntel } from "./IIntel";
import { IProbe } from "./IProbe";
import { IShipDetail } from "./IShipDetail";
import { ITradeRoute } from "./ITradeRoute";
import { FlightPlan } from "../api/FlightPlan";
import { Ship } from "../api/Ship";

class Database extends Dexie {
  apiErrors: Dexie.Table<IApiError, number>; // number = type of the primkey
  trades: Dexie.Table<ITrade, number>;
  markets: Dexie.Table<IMarket, number>;
  goodLocation: Dexie.Table<IGoodLocation, string>;
  strategies: Dexie.Table<IShipStrategy, string>;
  intel: Dexie.Table<IIntel, string>;
  probes: Dexie.Table<IProbe, string>;
  shipDetail: Dexie.Table<IShipDetail, string>;
  tradeRoutes: Dexie.Table<ITradeRoute, number>;
  flightPlans: Dexie.Table<FlightPlan, string>;
  ships: Dexie.Table<Ship, string>;

  constructor() {
    super("Database");
    this.version(49).stores({
      apiErrors: "++id, code",
      trades: "++id, good, shipId, location, type, timestamp",
      market: "++id,location,good,created",
      goodLocation: "[location+good], created",
      strategies: "&shipId",
      intel: "&shipId,username",
      probes: "&location,shipId",
      shipDetail: "&shipId, name",
      tradeRoutes2: "&shipId",
      flightPlans: "&shipId, &id",
      ships2: "&id",
    });
    // The following line is needed if your typescript
    // is compiled using babel instead of tsc:
    this.apiErrors = this.table("apiErrors");
    this.trades = this.table("trades");
    this.markets = this.table("market");
    this.strategies = this.table("strategies");
    this.intel = this.table("intel");
    this.probes = this.table("probes");
    this.shipDetail = this.table("shipDetail");
    this.goodLocation = this.table("goodLocation");
    this.tradeRoutes = this.table("tradeRoutes2");
    this.flightPlans = this.table("flightPlans");
    this.ships = this.table("ships2");
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
