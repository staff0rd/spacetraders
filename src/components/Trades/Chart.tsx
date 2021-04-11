import { useRef, useEffect } from "react";
import Chart from "chart.js/auto";
import "chartjs-adapter-luxon";
import { IMarket } from "data/IMarket";
import { DateTime } from "luxon";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  container: {
    height: 300,
    position: "relative",
  },
}));

type Props = {
  markets: IMarket[];
  good?: string | undefined;
  location?: string | undefined;
};

type GroupByLocation = {
  [key: string]: { name: string; values: { x: DateTime; y: number }[] };
};

export function groupByLocation(intel: IMarket[] | undefined) {
  const grouped: GroupByLocation = {};
  intel?.reduce(function (res: GroupByLocation, value: IMarket) {
    if (!res[value.good]) {
      res[value.good] = { name: value.good, values: [] };
      grouped[value.good] = res[value.good];
    }
    res[value.good].values.push({
      x: DateTime.fromISO(value.created),
      y: value.purchasePricePerUnit,
    });
    return res;
  }, {});
  return Object.values(grouped);
}

export const ChartComp = ({ good, location, markets }: Props) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const classes = useStyles();

  useEffect(() => {
    if (ref.current) {
      const ctx = ref.current.getContext("2d")!;

      const grouped = groupByLocation(markets);

      const datasets = grouped.map((g) => ({
        label: g.name,
        data: g.values,
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      }));

      console.log(datasets);
      const chart = new Chart(ctx, {
        type: "line",
        data: {
          datasets,
        },
        options: {
          maintainAspectRatio: false,
          scales: {
            x: {
              type: "time",
              time: {
                unit: "minute",
              },
            },
          },
        },
      });
      return () => chart.destroy();
    }
  }, [markets]);

  return (
    <div className={classes.container}>
      <canvas ref={ref} id="myChart"></canvas>
    </div>
  );
};
