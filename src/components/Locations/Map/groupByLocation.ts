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

type GroupByType = {
  shipType: string;
  count: number;
};
export function groupByTypeAtLocation(
  intel: IIntel[],
  symbol: string,
  inTransit: boolean
) {
  const result: GroupByType[] = [];
  intel.forEach((i) => {
    if (!result.find((a) => a.shipType === i.shipType))
      result.push({ shipType: i.shipType, count: 0 });
    if (i.destination === symbol) {
      if ((inTransit && !!i.departure) || (!inTransit && !i.departure))
        result.find((a) => a.shipType === i.shipType)!.count += 1;
    }
  });
  return result.filter((a) => a.count > 0);
}
