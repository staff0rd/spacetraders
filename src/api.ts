import { User } from "./store/User";

const getUrl = (segment: string) => `https://api.spacetraders.io/${segment}`;

type Status = {
  status: string;
};
export const getStatus = async () => {
  const result = await fetch(getUrl("game/status"));
  const json: Status = await result.json();
  console.log("getStatus", json);
  return json;
};

const post = async (urlSegment: string, data?: any) => {
  const response = await fetch(getUrl(urlSegment), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
};

export interface GetTokenResponse {
  token: string;
  user: User;
}

export const getToken = async (userName: string): Promise<GetTokenResponse> => {
  const json = await post(`users/${userName}/token`);
  return json;
};
