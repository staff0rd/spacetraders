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
import {
  makeStyles,
  Typography,
  FormControl,
  useTheme,
  useMediaQuery,
} from "@material-ui/core";
import green from "@material-ui/core/colors/green";
import red from "@material-ui/core/colors/red";
import NumberFormat from "react-number-format";
import { DateTime } from "luxon";

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
  formControl: {
    margin: theme.spacing(1),
    minWidth: 60,
  },
}));

type Props = {
  shipId?: string;
};

export const TradeRoutes = ({ shipId }: Props) => {
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const classes = useStyles();
  const tradeRoutes = useLiveQuery(() => {
    return shipId
      ? db.tradeData
          .where("shipId")
          .equals(shipId)
          .reverse()
          .limit(50)
          .toArray()
      : db.tradeData.reverse().limit(50).toArray();
  });

  if (!tradeRoutes) return <CircularProgress color="primary" size={48} />;

  const rows = tradeRoutes.map((row) => {
    const shipLink = (
      <Typography className={classes.text}>
        <Link to={`/ships/owned/${row.shipId}`}>
          {getShip(row.shipId).name}
        </Link>
      </Typography>
    );

    const route = `${getLocation(row.tradeRoute.buyLocation)?.name} > ${
      getLocation(row.tradeRoute.sellLocation)?.name
    }`;

    return [
      row.id,
      ...(isMdDown
        ? [
            <>
              {shipLink}
              {route}
            </>,
          ]
        : [shipLink, route]),
      row.tradeRoute.quantityToBuy,
      <GoodIcon good={row.tradeRoute.good} />,
      right(formatCurrency(Math.round(row.tradeRoute.totalProfit))),
      right(formatCurrency(row.profit)),
      <Trades detail={row} />,
    ];
  });
  const columns = [
    ...(isMdDown ? ["Ship / Route"] : ["Ship", "Route"]),
    "Qty",
    "Good",
    right("Expected"),
    right("Profit"),
  ];
  const rowClassName = (index: number): string =>
    clsx({
      [classes.loss]:
        tradeRoutes[index].complete === 1 && tradeRoutes[index].profit < 0,
      [classes.profit]:
        tradeRoutes[index].complete === 1 && tradeRoutes[index].profit >= 0,
    });

  const profit = tradeRoutes
    .filter((p) => p.complete === 1)
    .map((t) => t.profit || 0)
    .reduce((a, b) => a + b, 0);

  const profitPerMinute = tradeRoutes.length
    ? Math.round(
        profit /
          -DateTime.fromISO(
            tradeRoutes[tradeRoutes.length - 1].created
          ).diffNow("minutes").minutes
      )
    : 0;

  return (
    <>
      <FormControl className={classes.formControl}>
        <Typography className="MuiInputLabel-shrink">Cost</Typography>
        <NumberFormat
          value={tradeRoutes
            .filter((p) => p.complete === 1)
            .map((t) =>
              t.trades
                .filter((p) => p.cost < 0)
                .map((p) => p.cost)
                .reduce((a, b) => a + b, 0)
            )
            .reduce((a, b) => (a || 0) + (b || 0), 0)}
          thousandSeparator=","
          displayType="text"
          prefix="$"
        />
      </FormControl>
      <FormControl className={classes.formControl}>
        <Typography className="MuiInputLabel-shrink">Profit</Typography>
        <NumberFormat
          value={profit}
          thousandSeparator=","
          displayType="text"
          prefix="$"
        />
      </FormControl>
      <FormControl className={classes.formControl}>
        <Typography className="MuiInputLabel-shrink">per minute</Typography>
        <NumberFormat
          value={profitPerMinute}
          thousandSeparator=","
          displayType="text"
          prefix="$"
        />
      </FormControl>
      <DataTable
        title="Trades"
        rows={rows}
        columns={columns}
        rowClassName={rowClassName}
        firstColumnIsRowKey
        details
        detailRowClassName={classes.detailsRow}
      />
    </>
  );
};
