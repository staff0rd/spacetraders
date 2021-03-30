import Bottleneck from "bottleneck";
import { DateTime } from "luxon";
import { PromiseExtended } from "dexie";

type ResponseLimit<T> = {
  limits: LimitCache;
  cache: ResponseCache<T>;
};

type ResponseCache<T> = {
  [key: string]: {
    timestamp: DateTime;
    response: T;
  };
};
type LimitCache = { [key: string]: Bottleneck };

export const createCache = <T>(): ResponseLimit<T> => ({
  limits: {},
  cache: {},
});

export const getCachedResponse = async <T>(
  cache: ResponseLimit<T>,
  key: string,
  request: () => Promise<T>,
  onRequest?: (response: T) => Promise<any> | PromiseExtended<number>[],
  cacheForSeconds = 60
) => {
  if (!(key in cache.limits)) {
    cache.limits[key] = new Bottleneck({ maxConcurrent: 1 });
  }
  const work = async () => {
    if (
      key in cache.cache &&
      -cache.cache[key].timestamp.diffNow("seconds").seconds < cacheForSeconds
    ) {
      return Promise.resolve(cache.cache[key].response);
    }

    const result = await request();

    cache.cache[key] = {
      timestamp: DateTime.now(),
      response: result,
    };
    onRequest && onRequest(result);
    return result;
  };

  return cache.limits[key].schedule(work);
};
