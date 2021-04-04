import { IMarketNow } from "../../data/IMarket";

export function groupByGood(market: IMarketNow[] | undefined) {
  const grouped: GroupByGood = {};
  market?.reduce(function (res: GroupByGood, value: IMarketNow) {
    if (!res[value.good]) {
      res[value.good] = {
        good: value.good,
        locations: [],
      };
      grouped[value.good] = res[value.good];
    }
    res[value.good].locations.push(value);
    return res;
  }, {});
  return Object.values(grouped);
}
type GroupByGood = {
  [key: string]: { locations: IMarketNow[]; good: string };
};
