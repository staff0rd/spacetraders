import { DataTable, right } from "components/DataTable";
import { GoodIcon } from "./GoodIcon";
import { getLocation } from "data/localStorage/locationCache";
import { ITradeRouteData } from "data/ITradeRouteData";
import { DateTime } from "luxon";
import NumberFormat from "react-number-format";
import { fade } from "@material-ui/core/styles/colorManipulator";
import { makeStyles } from "@material-ui/core";
import green from "@material-ui/core/colors/green";
import red from "@material-ui/core/colors/red";
import clsx from "clsx";

const useStyles = makeStyles((theme) => ({
  profit: {
    backgroundColor: fade(green[500], 0.15),
  },
  loss: {
    backgroundColor: fade(red[500], 0.15),
  },
}));

export const Trades = ({ detail }: { detail: ITradeRouteData }) => {
  const classes = useStyles();
  const sorted = [...detail.trades].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  );
  const rowClassName = (index: number): string =>
    clsx({
      [classes.loss]: sorted[index].cost < 0,
      [classes.profit]: sorted[index].cost >= 0,
    });
  const rows = sorted.map((row) => [
    getLocation(row.location)?.name,
    row.type,
    <GoodIcon good={row.good} />,
    row.quantity,
    right(
      <NumberFormat
        value={row.cost}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
    right(
      <NumberFormat
        value={row.cost / row.quantity}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
    DateTime.fromISO(row.timestamp).toRelative(),
  ]);

  const columns = [
    "Location",
    "Type",
    "Good",
    "Qty",
    right("Cost"),
    right("Per"),
    "When",
  ];

  return (
    <DataTable
      title="Trades"
      columns={columns}
      rows={rows}
      rowClassName={rowClassName}
    />
  );
};
