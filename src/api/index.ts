import { AvailableLoan } from "./AvailableLoan";
import { AvailableShip } from "./AvailableShip";
import { Loan } from "./Loan";
import { LoanType } from "./LoanType";
import { Ship } from "./Ship";
import { User } from "./User";

const getUrl = (segment: string) => `https://api.spacetraders.io/${segment}`;

type Status = {
  status: string;
};
export const getStatus = async () => {
  const json: Status = await get("game/status");
  return json;
};

const get = async (urlSegment: string, headers = {}) => {
  const response = await fetch(getUrl(urlSegment), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
  return response.json();
};

const post = async (urlSegment: string, data?: any, headers = {}) => {
  const response = await fetch(getUrl(urlSegment), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
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

export const getAvailableLoans = async (
  token: string
): Promise<GetAvailableLoansResponse> => {
  return await getSecure(token, "game/loans");
};

interface GetLoansResponse {
  loans: Loan[];
}

export const getLoans = async (
  token: string,
  username: string
): Promise<GetLoansResponse> => {
  return await getSecure(token, `users/${username}/loans`);
};

export const requestNewLoan = async (
  token: string,
  username: string,
  type: LoanType
): Promise<GetAvailableLoansResponse> => {
  return await postSecure(token, `users/${username}/loans`, { type });
};

interface GetAvailableShipsResponse {
  ships: AvailableShip[];
}

export const getAvailableShips = async (
  token: string
): Promise<GetAvailableShipsResponse> => {
  return await getSecure(token, "game/ships");
};

interface GetShipsResponse {
  ships: Ship[];
}

export const getShips = async (
  token: string,
  username: string
): Promise<GetShipsResponse> => {
  return await getSecure(token, `users/${username}/ships`);
};

export const buyShip = async (
  token: string,
  username: string,
  location: string,
  type: string
): Promise<AvailableShip> => {
  return await postSecure(token, `users/${username}/ships`, { location, type });
};
