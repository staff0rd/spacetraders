import { AvailableLoan } from "./AvailableLoan";
import { LoanType } from "./LoanType";
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

export interface GetAvailableLoansResponse {
  loans: AvailableLoan[];
}

export const getAvailableLoans = async (
  token: string
): Promise<GetAvailableLoansResponse> => {
  return await getSecure(token, "game/loans");
};

export const getLoans = async (
  token: string,
  username: string
): Promise<GetAvailableLoansResponse> => {
  return await getSecure(token, `users/${username}/loans`);
};

export const requestNewLoan = async (
  token: string,
  username: string,
  type: LoanType
): Promise<GetAvailableLoansResponse> => {
  return await postSecure(token, `users/${username}/loans`, { type });
};
