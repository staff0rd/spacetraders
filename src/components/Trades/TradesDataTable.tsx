import { DataTable, right } from "../DataTable";
import Tooltip from "@material-ui/core/Tooltip";
import BuyIcon from "@material-ui/icons/AddCircle";
import SellIcon from "@material-ui/icons/RemoveCircle";
import clsx from "clsx";
import {
  makeStyles,
  Grid,
  FormControl,
  Typography,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@material-ui/core";
import green from "@material-ui/core/colors/green";
import blue from "@material-ui/core/colors/blue";
import { fade } from "@material-ui/core/styles/colorManipulator";
import { ITrade, TradeType } from "../../data/ITrade";
import NumberFormat from "react-number-format";
import { DateTime } from "luxon";
import { Link } from "react-router-dom";
import { GoodIcon } from "./GoodIcon";
import { ReactNode } from "react";
import { getLocation } from "data/localStorage/locationCache";
import { getShip } from "data/localStorage/shipCache";

const useStyles = makeStyles((theme) => ({
  buyIcon: {
    color: fade(blue[500], 0.3),
  },
  buy: {
    backgroundColor: fade(blue[500], 0.15),
  },
  sellIcon: {
    color: fade(green[500], 0.3),
  },
  sell: {
    backgroundColor: fade(green[500], 0.15),
  },
  link: {
    fontSize: 14,
    "& a": {
      color: "white",
    },
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 60,
  },
}));

type Props = {
  trades: ITrade[] | null | undefined;
  children?: ReactNode;
};

export const TradesDataTable = ({ trades, children }: Props) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));

  if (!trades) return <CircularProgress color="primary" size={24} />;

  const profit = trades
    .filter((t) => t.type === TradeType.Sell)
    .map((t) => t.profit || 0)
    .reduce((a, b) => a + b, 0);

  const profitPerMinute = trades.length
    ? Math.round(
        profit /
          -DateTime.fromISO(trades[trades.length - 1].timestamp).diffNow(
            "minutes"
          ).minutes
      )
    : 0;

  const columns = [
    "",
    "Ship",
    "Location",
    ...(isMdDown ? ["Qty x Good"] : ["Qty", "Good"]),
    right("Cost"),
    right("Profit"),
    "When",
  ];
  const rows = trades.map((trade) => [
    trade.type === TradeType.Buy ? (
      <Tooltip title="Buy">
        <BuyIcon className={classes.buyIcon} />
      </Tooltip>
    ) : (
      <Tooltip title="Sell">
        <SellIcon className={classes.sellIcon} />
      </Tooltip>
    ),
    <Typography className={classes.link}>
      <Link to={`/ships/owned/${trade.shipId}`}>
        {getShip(trade.shipId)!.name}
      </Link>
    </Typography>,
    getLocation(trade.location)!.name,
    ...(isMdDown
      ? [
          <div className={classes.center}>
            <NumberFormat
              value={trade.quantity}
              thousandSeparator=","
              displayType="text"
            />
            <GoodIcon good={trade.good} />
          </div>,
        ]
      : [
          <NumberFormat
            value={trade.quantity}
            thousandSeparator=","
            displayType="text"
          />,
          <GoodIcon good={trade.good} />,
        ]),

    right(
      <NumberFormat
        value={trade.cost}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
    right(
      <>
        {trade.type === TradeType.Buy && (
          <Tooltip title="Estimated">
            <span>*</span>
          </Tooltip>
        )}
        <NumberFormat
          value={trade.profit}
          thousandSeparator=","
          displayType="text"
          prefix="$"
        />
      </>
    ),
    DateTime.fromISO(trade.timestamp).toRelative(),
  ]);

  const rowClassName = (index: number): string =>
    clsx({
      [classes.sell]: trades[index].type === TradeType.Sell,
      [classes.buy]: trades[index].type === TradeType.Buy,
    });

  return (
    <>
      <Grid container>
        {children}
        <Grid item xs={12} md={6}>
          <FormControl className={classes.formControl}>
            <Typography className="MuiInputLabel-shrink">Cost</Typography>
            <NumberFormat
              value={trades
                .filter((t) => t.type === TradeType.Sell)
                .map((t) => t.cost)
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
        </Grid>
      </Grid>

      <DataTable
        title="Trades"
        columns={columns}
        rows={rows}
        rowClassName={rowClassName}
      />
    </>
  );
};
