import { IIntel } from "../../../data/IIntel";

type GroupByLocation = {
  [key: string]: { docked: number; inTransit: number; symbol: string };
};

export function groupByLocation(intel: IIntel[] | undefined) {
  const grouped: GroupByLocation = {};
  intel?.reduce(function (res: GroupByLocation, value: IIntel) {
    if (!res[value.destination]) {
      res[value.destination] = {
        docked: 0,
        inTransit: 0,
        symbol: value.destination,
      };
      grouped[value.destination] = res[value.destination];
    }
    if (value.departure) res[value.destination].inTransit += 1;
    else res[value.destination].docked += 1;
    return res;
  }, {});
  return Object.values(grouped);
}
