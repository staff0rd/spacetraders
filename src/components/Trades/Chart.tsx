import { useRef, useEffect, useState } from "react";
import Chart from "chart.js/auto";
import "chartjs-adapter-luxon";
import { IMarket } from "data/IMarket";
import { DateTime } from "luxon";
import { makeStyles } from "@material-ui/core";
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

type Data = {
  x: DateTime;
  y: number;
};

type Dataset = {
  label: string;
  data: Data[];
  fill: boolean;
  borderColor: string;
  tension: number;
};

type ChartType = {
  data: {
    datasets: Dataset[];
  };
  update: () => void;
  destroy: () => void;
};

const updateDataset = (chartDataset: Dataset, marketDataset: Dataset) => {
  const chartData = chartDataset.data;
  const marketData = marketDataset.data;
  const removeFromChart = chartData
    .map((value, ix) => ({ value, ix }))
    .filter(
      (p) => !marketData.map((p) => p.x.toISO()).includes(p.value.x.toISO())
    )
    .map((p) => p.ix)
    .sort((a, b) => b - a);

  const addToChart = marketData.filter(
    (p) => !chartData.map((p) => p.x.toISO()).includes(p.x.toISO())
  );
  if (addToChart.length) {
    addToChart.forEach((d) => chartData.push(d));
  }
  removeFromChart.forEach((ix) => chartData.splice(ix, 1));
  chartData.sort((a, b) => b.x.diff(a.x, "seconds").seconds);
};

export const ChartComp = ({ good, location, markets }: Props) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const classes = useStyles();
  const [chart, setChart] = useState<ChartType>();

  useEffect(
    () => {
      if (chart && chart.data && markets) {
        const marketDatasets = groupDatasets(good, markets);
        marketDatasets.forEach((marketDataset) => {
          const chartDataset = chart.data.datasets.find(
            (ds: Dataset) => ds.label === marketDataset.label
          );
          if (chartDataset) {
            updateDataset(chartDataset, marketDataset);
          } else chart.data.datasets.push(marketDataset);
        });

        ((chart.data.datasets as Dataset[]) || [])
          .map((value: Dataset, ix: number) => ({ value, ix }))
          .filter(
            (p) => !marketDatasets.map((p) => p.label).includes(p.value.label)
          )
          .map((p) => p.ix)
          .sort((a, b) => b - a)
          .forEach((ix) => chart.data.datasets.splice(ix, 1));

        chart.update();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [markets]
  );

  useEffect(() => {
    if (ref.current) {
      const ctx = ref.current.getContext("2d")!;
      chart?.destroy();
      const datasets = groupDatasets(good, markets);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [good, location]);

  return (
    <div className={classes.container}>
      <canvas ref={ref} id="myChart"></canvas>
    </div>
  );
};
function groupDatasets(good: string | undefined, markets: IMarket[]) {
  const grouped = good
    ? groupByLocation([...markets])
    : groupByGood([...markets]);
  const datasets = grouped.map((g, ix) => ({
    label: g.name,
    data: g.values,
    fill: false,
    borderColor: colors[ix],
    tension: 0.1,
  }));
  return datasets;
}
