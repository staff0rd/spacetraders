import { AvailableLoan } from "./AvailableLoan";
import { AvailableShip } from "./AvailableShip";
import { Loan } from "./Loan";
import { LoanType } from "./LoanType";
import { Ship } from "./Ship";
import { System } from "./System";
import { User } from "./User";
import Bottleneck from "bottleneck";
import { Location } from "./Location";
import { FlightPlan } from "./FlightPlan";
import db from "../data/";
import { DateTime } from "luxon";
import { GetFlightPlanResponse } from "./GetFlightPlanResponse";
import { GetFlightPlansResponse } from "./GetFlightPlansResponse";
import { getCachedResponse, createCache } from "./getCachedResponse";
import { newShipName } from "../data/names";
import { TradeType } from "../data/ITrade";
import { setLocalUser } from "../data/localStorage/getLocalUser";
import { setCredits } from "data/localStorage/getCredits";
import { cacheLocation, getLocation } from "data/localStorage/locationCache";
import { shouldWarp } from "data/getFuelNeeded";
import { setAvailableStructures } from "data/localStorage/getAvailableStructures";
import { AvailableStructure } from "./AvailableStructure";
import * as shipCache from "data/localStorage/shipCache";
import { saveTradeData } from "./saveTradeData";
import { GetLeaderboardResponse } from "./GetLeaderboardResponse";
import { makeRequest } from "./makeRequest";
import { init } from "data/probes";

export const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 500,
});

export type GetStatusResponse = {
  status: string;
};

export const getStatus = async () => {
  const json: GetStatusResponse = await get("game/status");
  return json;
};

const get = <T>(path: string, headers = {}): Promise<T> => {
  return limiter.schedule(() => makeRequest(path, "GET", headers));
};

const del = <T>(path: string, headers = {}): Promise<T> => {
  return limiter.schedule(() => makeRequest(path, "DELETE", headers));
};

const post = <T>(path: string, data?: any, headers = {}): Promise<T> => {
  return limiter.schedule(() => makeRequest(path, "POST", headers, data));
};

export interface GetTokenResponse {
  token: string;
  user: User;
}

export const getToken = async (username: string): Promise<GetTokenResponse> => {
  const result = await post<GetTokenResponse>(`users/${username}/token`);
  setLocalUser(result);
  return result;
};

const postSecure = async <T>(
  token: string,
  urlSegment: string,
  data?: any
): Promise<T> => {
  return post(urlSegment, data, {
    Authorization: `Bearer ${token}`,
  });
};

const getSecure = async <T>(token: string, urlSegment: string): Promise<T> => {
  return get(urlSegment, {
    Authorization: `Bearer ${token}`,
  });
};
const deleteSecure = async <T>(
  token: string,
  urlSegment: string
): Promise<T> => {
  return del<T>(urlSegment, {
    Authorization: `Bearer ${token}`,
  });
};

type GetDockedShipsResponse = {
  ships: {
    shipId: string;
    username: string;
    shipType: string;
  }[];
};

export const getStructures = async (token: string, location: string) => {
  const result = await getSecure<GetLocationResponse>(
    token,
    `game/locations/${location}`
  );

  cacheLocation(result.location);

  return result;
};

export const getDockedShips = async (token: string, location: string) => {
  const result = await getSecure<GetDockedShipsResponse>(
    token,
    `game/locations/${location}/ships`
  );
  await Promise.all(
    result.ships.map((ship) =>
      db.intel.put({
        destination: location,
        lastSeen: DateTime.now().toISO(),
        shipId: ship.shipId,
        shipType: ship.shipType,
        username: ship.username,
      })
    )
  );
  return result;
};

export const getFlightPlan = async (
  token: string,
  username: string,
  flightPlanId?: string
): Promise<GetFlightPlanResponse> => {
  if (flightPlanId) {
    const flightPlan = await db.flightPlans
      .where("id")
      .equals(flightPlanId)
      .first();
    if (flightPlan) return { flightPlan };
  }

  const result = await getSecure<GetFlightPlanResponse>(
    token,
    `users/${username}/flight-plans/${flightPlanId}`
  );
  await db.flightPlans.put(result.flightPlan);
  flightPlanToIntel(result.flightPlan);
  return result;
};

export interface GetAvailableLoansResponse {
  loans: AvailableLoan[];
}

export const getAvailableLoans = (
  token: string
): Promise<GetAvailableLoansResponse> => getSecure(token, "game/loans");

interface GetLoansResponse {
  loans: Loan[];
}

export const getLoans = (
  token: string,
  username: string
): Promise<GetLoansResponse> => getSecure(token, `users/${username}/loans`);

export type GetLoanResponse = {
  credits: number;
  loan: Loan;
};
export const requestNewLoan = async (
  token: string,
  username: string,
  type: LoanType
): Promise<GetLoanResponse> => {
  const result = await postSecure<GetLoanResponse>(
    token,
    `users/${username}/loans`,
    { type }
  );
  setCredits(result.credits);
  return result;
};

export interface GetAvailableShipsResponse {
  ships: AvailableShip[];
}

export const getAvailableShips = (
  token: string
): Promise<GetAvailableShipsResponse> => getSecure(token, "game/ships");

export interface GetSystemsResponse {
  systems: System[];
}

export const getSystems = async (
  token: string
): Promise<GetSystemsResponse> => {
  const result = await getSecure<GetSystemsResponse>(token, "game/systems");
  await Promise.all(
    result.systems.map((s) =>
      s.locations.map(async (location) => {
        cacheLocation(location);
        await init(location);
      })
    )
  );
  return result;
};

const marketCache = createCache<GetLocationResponse>();

export type GetLocationResponse = {
  location: Location;
};

export const getMarket = (
  token: string,
  location: string
): Promise<GetLocationResponse> =>
  getCachedResponse(
    marketCache,
    location,
    () =>
      getSecure<GetLocationResponse>(
        token,
        `game/locations/${location}/marketplace`
      ),
    async (result) => {
      cacheLocation(result.location);
      return Promise.all(
        result.location.marketplace!.map((m) => {
          const market = {
            created: DateTime.now().toISO(),
            location,
            purchasePricePerUnit: m.purchasePricePerUnit,
            sellPricePerUnit: m.sellPricePerUnit,
            quantityAvailable: m.quantityAvailable,
            volumePerUnit: m.volumePerUnit,
            good: m.symbol,
            x: result.location.x,
            y: result.location.y,
            type: result.location.type,
          };
          db.goodLocation.put(market);
          return db.markets.put(market);
        })
      );
    }
  );

export interface GetShipResponse {
  ship: Ship;
}

export const getShip = async (
  token: string,
  username: string,
  shipId: string
): Promise<GetShipResponse> => {
  const flightPlan = await db.flightPlans.get(shipId);
  if (flightPlan && DateTime.fromISO(flightPlan.arrivesAt) > DateTime.now()) {
    const ship = await db.ships.get(shipId);
    if (ship) {
      ship.location = undefined;
      return { ship };
    }
  }

  const result = await getSecure<GetShipResponse>(
    token,
    `users/${username}/ships/${shipId}`
  );
  await shipCache.saveShip(result.ship);
  return result;
};

export interface GetShipsResponse {
  ships: Ship[];
}

export const getShips = async (
  token: string,
  username: string
): Promise<GetShipsResponse> => {
  const result = await getSecure<GetShipsResponse>(
    token,
    `users/${username}/ships`
  );
  shipCache.saveShips(result.ships);
  return result;
};

const clearShipFromDatabase = async (shipId: string) => {
  console.warn("Deleting ship");
  await db.strategies.delete(shipId);
  await db.ships.delete(shipId);
  await db.flightPlans.delete(shipId);
  await db.shipDetail.where("shipId").equals(shipId).modify({ deleted: true });
};
export const scrapShip = async (
  token: string,
  username: string,
  shipId: string
): Promise<{ success: string }> => {
  try {
    const result = await deleteSecure<{ success: string }>(
      token,
      `users/${username}/ships/${shipId}`
    );

    await clearShipFromDatabase(shipId);
    return result;
  } catch (e) {
    if (e.message === "You can not sell a ship you do not own.") {
      await clearShipFromDatabase(shipId);
    }
    console.error("There was a problem", e);
    throw e;
  }
};

export type BuyShipResponse = {
  credits: number;
  ship: Ship;
};

export const buyShip = async (
  token: string,
  username: string,
  location: string,
  type: string
): Promise<BuyShipResponse> => {
  const result = await postSecure<BuyShipResponse>(
    token,
    `users/${username}/ships`,
    {
      location,
      type,
    }
  );

  setCredits(result.credits);
  await shipCache.saveShip(result.ship);
  const newName = newShipName();
  await shipCache.saveDetail({ shipId: result.ship.id, name: newName });
  shipCache.addShip(result.ship, newName);

  return result;
};

export type MarketOrder = {
  good: string;
  pricePerUnit: number;
  quantity: number;
  total: number;
};

export type PurchaseOrderResponse = {
  ship: Ship;
  credits: number;
  order: MarketOrder;
};

export const purchaseOrder = async (
  token: string,
  username: string,
  shipId: string,
  good: string,
  quantity: number,
  location: string,
  profit?: number
): Promise<PurchaseOrderResponse> => {
  const result = await postSecure<PurchaseOrderResponse>(
    token,
    `users/${username}/purchase-orders`,
    {
      shipId,
      good,
      quantity,
    }
  );
  setCredits(result.credits);
  await db.trades.put({
    cost: result.order.total,
    type: TradeType.Buy,
    good,
    quantity,
    location,
    shipId,
    timestamp: DateTime.now().toISO(),
    profit,
  });
  await shipCache.saveShip(result.ship);
  await saveTradeData(shipId, result.order, location, TradeType.Buy);
  return result;
};

export const sellOrder = async (
  token: string,
  username: string,
  shipId: string,
  good: string,
  quantity: number,
  location: string
): Promise<PurchaseOrderResponse> => {
  const result = await postSecure<PurchaseOrderResponse>(
    token,
    `users/${username}/sell-orders`,
    {
      shipId,
      good,
      quantity,
    }
  );
  setCredits(result.credits);
  await shipCache.saveShip(result.ship);
  await saveTradeData(shipId, result.order, location, TradeType.Sell);

  return result;
};

export const getLeaderboard = async (
  token: string
): Promise<GetLeaderboardResponse> =>
  getSecure(token, "game/leaderboard/net-worth");

const flightPlansCache = createCache<GetFlightPlansResponse>();

export const getFlightPlans = async (
  token: string,
  username: string,
  symbol: string
): Promise<GetFlightPlansResponse> => {
  return getCachedResponse(
    flightPlansCache,
    symbol,
    () =>
      getSecure<GetFlightPlansResponse>(
        token,
        `game/systems/${symbol}/flight-plans`
      ),
    async (result) => {
      result.flightPlans.map((fp) => flightPlanToIntel(fp));
      await Promise.all(
        result.flightPlans
          .filter((fp) => fp.username === username)
          .map((fp) => db.flightPlans.put(fp))
      );
    }
  );
};

const warpJump = async (
  token: string,
  username: string,
  shipId: string
): Promise<{ flightPlan: FlightPlan }> => {
  const result = await postSecure<{ flightPlan: FlightPlan }>(
    token,
    `users/${username}/warp-jump`,
    { shipId }
  );
  await db.flightPlans.put(result.flightPlan);
  flightPlanToIntel(result.flightPlan);
  return result;
};

export const newFlightPlan = async (
  token: string,
  username: string,
  shipId: string,
  departure: string,
  destination: string
): Promise<{ flightPlan: FlightPlan }> => {
  const from = getLocation(departure)!;
  const to = getLocation(destination)!;

  if (!from || !to) throw new Error("Could not determine locations");

  const result = await (shouldWarp(from.type, to.type)
    ? warpJump(token, username, shipId)
    : postSecure<{ flightPlan: FlightPlan }>(
        token,
        `users/${username}/flight-plans`,
        { shipId, destination }
      ));
  await db.flightPlans.put(result.flightPlan);
  const ship = await db.ships.get(shipId);
  ship!.cargo = [
    ...ship!.cargo.map((c) =>
      c.good !== "FUEL"
        ? c
        : {
            ...c,
            quantity: result.flightPlan.fuelRemaining,
          }
    ),
  ];
  await shipCache.saveShip(ship!);
  flightPlanToIntel(result.flightPlan);
  return result;
};

export type GetUserResponse = {
  user: {
    username: string;
    credits: number;
    ships: Ship[];
    loans: Loan[];
  };
};

export interface GetAvailableStructuresResponse {
  structures: AvailableStructure[];
}

export const getAvailableStructures = async (token: string) => {
  const result = await getSecure<GetAvailableStructuresResponse>(
    token,
    "game/structures"
  );
  setAvailableStructures(result);
  return result;
};

export const getUser = async (
  token: string,
  username: string
): Promise<GetUserResponse> => {
  const result = await getSecure<GetUserResponse>(token, `users/${username}`);
  await shipCache.saveShips(result.user.ships);
  setCredits(result.user.credits);
  return result;
};

function flightPlanToIntel(fp: FlightPlan) {
  return db.intel.put({
    shipId: fp.shipId,
    destination: fp.destination,
    departure: fp.departure,
    lastSeen: DateTime.now().toISO(),
    shipType: fp.shipType!,
    username: fp.username!,
  });
}
