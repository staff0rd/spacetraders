import { DataTable, right } from "components/DataTable";
import db from "data";
import { useLiveQuery } from "dexie-react-hooks";
import CircularProgress from "@material-ui/core/CircularProgress";
import { getShip } from "data/localStorage/shipCache";
import { formatCurrency } from "machines/Ship/formatNumber";
import { GoodIcon } from "./GoodIcon";
import { makeStyles, Typography } from "@material-ui/core";
import { Link } from "react-router-dom";
import { fade } from "@material-ui/core/styles/colorManipulator";
import green from "@material-ui/core/colors/green";
import red from "@material-ui/core/colors/red";
import clsx from "clsx";
import { getLocation } from "data/localStorage/locationCache";
import { ITradeRouteData } from "data/ITradeRouteData";
import { DateTime } from "luxon";
import NumberFormat from "react-number-format";

const useStyles = makeStyles((theme) => ({
  text: {
    fontSize: 14,
    "& a": {
      color: "white",
    },
  },
  profit: {
    backgroundColor: fade(green[500], 0.15),
  },
  loss: {
    backgroundColor: fade(red[500], 0.15),
  },
}));

const Trades = ({ detail }: { detail: ITradeRouteData }) => {
  const rows = [...detail.trades]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .map((row) => [
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
      DateTime.fromISO(row.timestamp).toRelative(),
    ]);

  const columns = ["Location", "Type", "Good", "Qty", "Cost", "When"];

  return <DataTable title="Trades" columns={columns} rows={rows} />;
};

export const TradeRoutes = () => {
  const classes = useStyles();
  const tradeRoutes = useLiveQuery(() => {
    return db.tradeData.reverse().limit(50).toArray();
  });

  if (!tradeRoutes) return <CircularProgress color="primary" size={48} />;

  const rows = tradeRoutes.map((row) => [
    row.id,
    <Typography className={classes.text}>
      <Link to={`/ships/owned/${row.shipId}`}>{getShip(row.shipId).name}</Link>
    </Typography>,
    `${getLocation(row.tradeRoute.buyLocation)?.name} > ${
      getLocation(row.tradeRoute.sellLocation)?.name
    }`,
    row.tradeRoute.quantityToBuy,
    <GoodIcon good={row.tradeRoute.good} />,
    right(formatCurrency(row.profit)),
    <Trades detail={row} />,
  ]);
  const columns = ["Ship", "Route", "Qty", "Good", right("Profit")];
  const rowClassName = (index: number): string =>
    clsx({
      [classes.loss]:
        tradeRoutes[index].complete === 1 && tradeRoutes[index].profit < 0,
      [classes.profit]:
        tradeRoutes[index].complete === 1 && tradeRoutes[index].profit >= 0,
    });

  return (
    <DataTable
      title="Trades"
      rows={rows}
      columns={columns}
      rowClassName={rowClassName}
      firstColumnIsRowKey
      details
    />
  );
};
