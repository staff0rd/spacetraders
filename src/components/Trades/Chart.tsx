import { useRef, useEffect, useState } from "react";
import Chart from "chart.js/auto";
import "chartjs-adapter-luxon";
import { IMarket } from "data/IMarket";
import { DateTime } from "luxon";
import { makeStyles } from "@material-ui/core";
import { useInterval } from "components/useInterval";
import { Colors, ColorUtils } from "./Colors";
const colors = Object.values(Colors)
  .filter((p) => (p as any).C500 !== undefined)
  .map((p) => (p as any).C400)
  .map((p) => ColorUtils.toHtml(p));

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

type Grouped = {
  [key: string]: { name: string; values: { x: DateTime; y: number }[] };
};

export function groupByGood(intel: IMarket[] | undefined) {
  console.log("grouping by good");
  const grouped: Grouped = {};
  intel?.reduce(function (res: Grouped, value: IMarket) {
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

export function groupByLocation(intel: IMarket[] | undefined) {
  console.log("grouping by location");
  const grouped: Grouped = {};
  intel?.reduce(function (res: Grouped, value: IMarket) {
    if (!res[value.location]) {
      res[value.location] = { name: value.location, values: [] };
      grouped[value.location] = res[value.location];
    }
    res[value.location].values.push({
      x: DateTime.fromISO(value.created),
      y: value.purchasePricePerUnit,
    });
    return res;
  }, {});
  return Object.values(grouped);
}

type Dataset = {
  label: string;
  data: {
    x: DateTime;
    y: number;
  }[];
  fill: boolean;
  borderColor: string;
  tension: number;
};

export const ChartComp = ({ good, location, markets }: Props) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const classes = useStyles();
  const [chart, setChart] = useState<Chart>();

  useInterval(() => {
    if (chart) {
      // chart.data.datasets.forEach((dataset: Dataset) => {
      //   console.log(dataset.data.length);
      //   const newData = [...marketsFromProps]
      //     .reverse()
      //     .map((d) => ({
      //       x: DateTime.fromISO(d.created),
      //       y: d.purchasePricePerUnit,
      //     }));
      //   console.log("adding", newData);
      //   dataset.data.push(...newData);
      //   chart.update();
      //});
    }
  }, 1000);

  console.log("good", good, "location", location);

  useEffect(() => {
    if (ref.current) {
      const ctx = ref.current.getContext("2d")!;
      chart?.destroy();
      const grouped = good
        ? groupByLocation([...markets].reverse())
        : groupByGood([...markets].reverse());
      const datasets = grouped.map((g, ix) => ({
        label: g.name,
        data: g.values,
        fill: false,
        borderColor: colors[ix],
        tension: 0.1,
      }));
      setChart(
        new Chart(ctx, {
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
        })
      );
      return () => chart?.destroy();
    }
  }, [good, location]);

  return (
    <div className={classes.container}>
      <canvas ref={ref} id="myChart"></canvas>
    </div>
  );
};
