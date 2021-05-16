import db from "../data/";
import { DateTime } from "luxon";
import Dexie from "dexie";

const MAX_SHIP_REQUESTS = 20;

class ApiError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}

const getUrl = (path: string) => `https://api.spacetraders.io/${path}`;

async function trimShipRequests(shipId: string) {
  await db.requests
    .where("[shipId+id]")
    .between([shipId, Dexie.minKey], [shipId, Dexie.maxKey])
    .reverse()
    .offset(MAX_SHIP_REQUESTS)
    .delete();
}

export const makeRequest = async (
  path: string,
  method: "GET" | "POST" | "DELETE",
  headers: any,
  data: any = undefined,
  retry = 0
): Promise<any> => {
  const isShipRequest = !!data?.shipId;
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
    await db.apiErrors
      .put({
        code: result.error.code,
        message: result.error.message,
        path,
        data,
        created: DateTime.now().toISO(),
      })
      .catch((reason) => console.error("Cound not save error: ", reason));
    if (isShipRequest) {
      await db.requests.put({
        isError: true,
        path,
        request: data,
        response: result.error,
        shipId: data.shipId,
        timestamp: DateTime.local().toISO(),
      });
      await trimShipRequests(data.shipId);
    }
    // if (result.error.code === 42901) {
    //   // throttle
    //   if (retry < 3) {
    //     console.log(`Hit rate limit, will retry for attempt ${retry + 2}}`);
    //     return limiter.schedule(() =>
    //       makeRequest(path, method, headers, data, retry + 1)
    //     );
    //   }
    // }
    throw new ApiError(result.error.message, result.error.code);
  }
  if (isShipRequest) {
    await db.requests.put({
      isError: false,
      path,
      request: data,
      response: result,
      shipId: data.shipId,
      timestamp: DateTime.local().toISO(),
    });
    await trimShipRequests(data.shipId);
  }
  return result;
};
