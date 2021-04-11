import { useLiveQuery } from "dexie-react-hooks";
import db from "data";
import { DataTable } from "../DataTable";
import { CircularProgress, makeStyles, Typography } from "@material-ui/core";
import NumberFormat from "react-number-format";
import { Link } from "react-router-dom";
import { DateTime } from "luxon";
import { GoodIcon } from "./GoodIcon";

const useStyles = makeStyles((theme) => ({
  link: {
    fontSize: 14,
    "& a": {
      color: "white",
    },
  },
}));

export const Current = () => {
  const classes = useStyles();
  const routes = useLiveQuery(() =>
    db.tradeRoutes.reverse().limit(50).toArray()
  );
  const shipDetail = useLiveQuery(() => db.shipDetail.toArray());
  if (!routes || !shipDetail) return <CircularProgress size={24} />;

  const columns = [
    "Ship",
    "Buy",
    "Sell",
    "Distance",
    "Good",
    "Qty",
    "Profit / Unit",
    "Total",
    "",
  ];
  const rows = routes.map((route) => [
    <Typography className={classes.link}>
      <Link to={`/ships/owned/${route.shipId}`}>
        {shipDetail?.find((sd) => sd.shipId === route.shipId)?.name}
      </Link>
    </Typography>,
    route.buyLocation,
    route.sellLocation,
    <NumberFormat
      value={Math.round(route.distance)}
      thousandSeparator=","
      displayType="text"
    />,
    <GoodIcon good={route.good} />,
    <NumberFormat
      value={route.quantityToBuy}
      thousandSeparator=","
      displayType="text"
    />,
    <NumberFormat
      value={route.profitPerUnit}
      thousandSeparator=","
      displayType="text"
      prefix="$"
    />,
    <NumberFormat
      value={route.totalProfit}
      thousandSeparator=","
      displayType="text"
      prefix="$"
    />,
    DateTime.fromISO(route.created).toRelative(),
  ]);
  return <DataTable title="Trade Routes" columns={columns} rows={rows} />;
};
