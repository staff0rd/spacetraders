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
import { getShipName } from "../data/names";
import { TradeType } from "../data/ITrade";

class ApiError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}

export const getUrl = (path: string) => `https://api.spacetraders.io/${path}`;

const limiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 500,
});

(window as any).limiter = limiter;

export type GetStatusResponse = {
  status: string;
};

export const getStatus = async () => {
  const json: GetStatusResponse = await get("game/status");
  return json;
};

const makeRequest = async (
  path: string,
  method: "GET" | "POST",
  headers: any,
  data: any = undefined
) => {
  const body = data ? JSON.stringify(data) : undefined;
  const response = await fetch(getUrl(path), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body,
  });
  const result = await response.json();

  if (!response.ok) {
    db.apiErrors
      .put({
        code: result.error.code,
        message: result.error.message,
        path,
        data,
        created: DateTime.now().toISO(),
      })
      .catch((reason) => console.error("Cound not save error: ", reason));
    throw new ApiError(result.error.message, result.error.code);
  }
  return result;
};

const get = (path: string, headers = {}) => {
  return limiter.schedule(() => makeRequest(path, "GET", headers));
};

const post = (path: string, data?: any, headers = {}) => {
  return limiter.schedule(() => makeRequest(path, "POST", headers, data));
};

export interface GetTokenResponse {
  token: string;
  user: User;
}

export const getToken = async (username: string): Promise<GetTokenResponse> => {
  const json = await post(`users/${username}/token`);
  return json;
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

type GetDockedShipsResponse = {
  location: {
    ships: {
      shipId: string;
      username: string;
      shipType: string;
    }[];
  };
};

export const getDockedShips = async (token: string, location: string) => {
  const result = await getSecure<GetDockedShipsResponse>(
    token,
    `game/locations/${location}/ships`
  );
  result.location.ships.map((ship) =>
    db.intel.put({
      destination: location,
      lastSeen: DateTime.now().toISO(),
      shipId: ship.shipId,
      shipType: ship.shipType,
      username: ship.username,
    })
  );
  return result;
};

export const getFlightPlan = (
  token: string,
  username: string,
  flightPlanId: string
): Promise<GetFlightPlanResponse> =>
  getSecure(token, `users/${username}/flight-plans/${flightPlanId}`);

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

export const requestNewLoan = (
  token: string,
  username: string,
  type: LoanType
): Promise<GetUserResponse> =>
  postSecure(token, `users/${username}/loans`, { type });

interface GetAvailableShipsResponse {
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
  result.systems.map((s) =>
    s.locations.map(async (location) => {
      if (
        (await db.probes.where("location").equals(location.symbol).count()) ===
        0
      ) {
        db.probes.put({
          location: location.symbol,
          x: location.x,
          y: location.y,
          type: location.type,
        });
      }
    })
  );
  return result;
};

const marketCache = createCache<GetMarketResponse>();

export type GetMarketResponse = {
  location: Location;
};

export const getMarket = (
  token: string,
  location: string
): Promise<GetMarketResponse> =>
  getCachedResponse(
    marketCache,
    location,
    () =>
      getSecure<GetMarketResponse>(
        token,
        `game/locations/${location}/marketplace`
      ),
    (result) =>
      result.location.marketplace.map((m) => {
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

export interface GetShipResponse {
  ship: Ship;
}

export const getShip = (
  token: string,
  username: string,
  shipId: string
): Promise<GetShipResponse> =>
  getSecure(token, `users/${username}/ships/${shipId}`);

export interface GetShipsResponse {
  ships: Ship[];
}

export const getShips = (
  token: string,
  username: string
): Promise<GetShipsResponse> => getSecure(token, `users/${username}/ships`);

export const buyShip = async (
  token: string,
  username: string,
  location: string,
  type: string
): Promise<GetUserResponse> => {
  const result = await postSecure<GetUserResponse>(
    token,
    `users/${username}/ships`,
    { location, type }
  );
  result.user.ships.map((s) => getShipName(s.id));
  return result;
};

type Order = {
  good: string;
  pricePerUnit: number;
  quantity: number;
  total: number;
};

export type PurchaseOrderResponse = {
  ship: Ship;
  credits: number;
  order: Order;
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
  db.trades.put({
    cost: result.order.total,
    type: TradeType.Buy,
    good,
    quantity,
    location,
    shipId,
    timestamp: DateTime.now().toISO(),
    profit,
  });
  return result;
};

export const sellOrder = (
  token: string,
  username: string,
  shipId: string,
  good: string,
  quantity: number
): Promise<PurchaseOrderResponse> =>
  postSecure(token, `users/${username}/sell-orders`, {
    shipId,
    good,
    quantity,
  });

const flightPlansCache = createCache<GetFlightPlansResponse>();

export const getFlightPlans = async (
  token: string,
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
    (result) =>
      result.flightPlans.map((fp) =>
        db.intel.put({
          shipId: fp.shipId,
          destination: fp.destination,
          departure: fp.departure,
          lastSeen: DateTime.now().toISO(),
          shipType: fp.shipType!,
          username: fp.username!,
        })
      )
  );
};

export const newFlightPlan = (
  token: string,
  username: string,
  shipId: string,
  destination: string
): Promise<{ flightPlan: FlightPlan }> =>
  postSecure(token, `users/${username}/flight-plans`, { shipId, destination });

export type GetUserResponse = {
  user: {
    username: string;
    credits: number;
    ships: Ship[];
    loans: Loan[];
  };
};

export const getUser = (
  token: string,
  username: string
): Promise<GetUserResponse> => getSecure(token, `users/${username}`);
