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
import { PromiseExtended } from "dexie";

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

const postSecure = async (token: string, urlSegment: string, data?: any) => {
  return post(urlSegment, data, {
    Authorization: `Bearer ${token}`,
  });
};

const getSecure = async <T>(token: string, urlSegment: string): Promise<T> => {
  return get(urlSegment, {
    Authorization: `Bearer ${token}`,
  });
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

export const getSystems = (token: string): Promise<GetSystemsResponse> =>
  getSecure(token, "game/systems");

export type GetMarketResponse = {
  location: Location;
};

type ResponseCache<T> = {
  [key: string]: {
    timestamp: DateTime;
    response: T;
  };
};

type LimitCache = { [key: string]: Bottleneck };

const marketLimits: LimitCache = {};
const marketCache: ResponseCache<GetMarketResponse> = {};

const getCachedResponse = async <T>(
  limits: LimitCache,
  cache: ResponseCache<T>,
  key: string,
  request: () => Promise<T>,
  onRequest?: (response: T) => Promise<any> | PromiseExtended<number>[],
  cacheForSeconds = 60
) => {
  if (!(key in limits)) {
    limits[key] = new Bottleneck({ maxConcurrent: 1 });
  }
  const work = async () => {
    if (
      key in cache &&
      -cache[key].timestamp.diffNow("seconds").seconds < cacheForSeconds
    ) {
      console.log("found in cache");
      return Promise.resolve(cache[key].response);
    }
    console.log("not in cache, requesting...", cache[key]);

    const result = await request();

    cache[key] = {
      timestamp: DateTime.now(),
      response: result,
    };
    onRequest && onRequest(result);
    return result;
  };

  return limits[key].schedule(work);
};

export const getMarket = (
  token: string,
  location: string
): Promise<GetMarketResponse> =>
  getCachedResponse(
    marketLimits,
    marketCache,
    location,
    async () =>
      getSecure<GetMarketResponse>(
        token,
        `game/locations/${location}/marketplace`
      ),
    (result) =>
      result.location.marketplace.map((m) =>
        db.markets.put({
          created: DateTime.now().toISO(),
          location,
          pricePerUnit: m.pricePerUnit,
          quantityAvailable: m.quantityAvailable,
          volumePerUnit: m.volumePerUnit,
          good: m.symbol,
          spread: m.spread,
        })
      )
  );

interface GetShipsResponse {
  ships: Ship[];
}

export const getShips = (
  token: string,
  username: string
): Promise<GetShipsResponse> => getSecure(token, `users/${username}/ships`);

export const buyShip = (
  token: string,
  username: string,
  location: string,
  type: string
): Promise<GetUserResponse> =>
  postSecure(token, `users/${username}/ships`, { location, type });

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

export const purchaseOrder = (
  token: string,
  username: string,
  shipId: string,
  good: string,
  quantity: number
): Promise<PurchaseOrderResponse> =>
  postSecure(token, `users/${username}/purchase-orders`, {
    shipId,
    good,
    quantity,
  });

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

export const getFlightPlans = async (
  token: string,
  symbol: string
): Promise<GetFlightPlansResponse> => {
  const result = await getSecure<GetFlightPlansResponse>(
    token,
    `game/systems/${symbol}/flight-plans`
  );
  result.flightPlans.map((fp) =>
    db.intel.put({
      shipId: fp.shipId,
      destination: fp.destination,
      departure: fp.departure,
      lastSeen: DateTime.now().toISO(),
      shipType: fp.shipType!,
      username: fp.username!,
    })
  );
  return result;
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
