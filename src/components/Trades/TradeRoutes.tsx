import { DataTable, right } from "components/DataTable";
import db from "data";
import { useLiveQuery } from "dexie-react-hooks";
import CircularProgress from "@material-ui/core/CircularProgress";
import { getShip } from "data/localStorage/shipCache";
import { formatCurrency } from "machines/Ship/formatNumber";
import { GoodIcon } from "./GoodIcon";
import { Link } from "react-router-dom";
import { fade } from "@material-ui/core/styles/colorManipulator";
import clsx from "clsx";
import { getLocation } from "data/localStorage/locationCache";
import { Trades } from "./Trades";
import { makeStyles, Typography } from "@material-ui/core";
import green from "@material-ui/core/colors/green";
import red from "@material-ui/core/colors/red";

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
  detailsRow: {
    backgroundColor: "#303030",
  },
}));

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
    right(formatCurrency(Math.round(row.tradeRoute.totalProfit))),
    <Trades detail={row} />,
  ]);
  const columns = [
    "Ship",
    "Route",
    "Qty",
    "Good",
    right("Profit"),
    right("Expected"),
  ];
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
      detailRowClassName={classes.detailsRow}
    />
  );
};
