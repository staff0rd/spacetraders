import { AvailableLoan } from "./AvailableLoan";
import { AvailableShip } from "./AvailableShip";
import { Loan } from "./Loan";
import { LoanType } from "./LoanType";
import { Ship } from "./Ship";
import { System } from "./System";
import { User } from "./User";
import Bottleneck from "bottleneck";
import { Location } from "./Location";

const getUrl = (segment: string) => `https://api.spacetraders.io/${segment}`;

const limiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 500,
});

export type GetStatusResponse = {
  status: string;
};

export const getStatus = async () => {
  const json: GetStatusResponse = await get("game/status");
  return json;
};

const makeRequest = async (
  url: string,
  method: "GET" | "POST",
  headers: any,
  data: any = undefined,
  retry = 0
) => {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error.message);
  }
  return result;
};

const get = (urlSegment: string, headers = {}) => {
  return limiter.schedule(() =>
    makeRequest(getUrl(urlSegment), "GET", headers)
  );
};

const post = (urlSegment: string, data?: any, headers = {}) => {
  return limiter.schedule(() =>
    makeRequest(getUrl(urlSegment), "POST", headers, data)
  );
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

const getSecure = async (token: string, urlSegment: string) => {
  return get(urlSegment, {
    Authorization: `Bearer ${token}`,
  });
};

interface GetAvailableLoansResponse {
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
): Promise<GetAvailableLoansResponse> =>
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

type GetMarketResponse = {
  planet: Location;
};

export const getMarket = (
  token: string,
  symbol: string
): Promise<GetMarketResponse> =>
  getSecure(token, `game/locations/${symbol}/marketplace`);

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
): Promise<AvailableShip> =>
  postSecure(token, `users/${username}/ships`, { location, type });

export const purchaseOrder = (
  token: string,
  username: string,
  shipId: string,
  good: string,
  quantity: number
): Promise<any> =>
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
): Promise<any> =>
  postSecure(token, `users/${username}/sell-orders`, {
    shipId,
    good,
    quantity,
  });

export const getFlightPlans = (token: string, symbol: string): Promise<any> =>
  getSecure(token, `game/systems/${symbol}/flight-plans`);

export const newFlightPlan = (
  token: string,
  username: string,
  shipId: string,
  destination: string
): Promise<any> =>
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
