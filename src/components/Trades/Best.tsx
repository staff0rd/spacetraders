import { DataTable, right } from "../DataTable";
import {
  CircularProgress,
  makeStyles,
  Typography,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@material-ui/core";
import db from "data";
import NumberFormat from "react-number-format";
import { GoodIcon } from "./GoodIcon";
import { SystemContext } from "machines/MarketContext";
import { getLocationName, getLocations } from "./getLocations";
import { determineBestTradeRoute } from "machines/Ship/determineBestTradeRoute";
import { useState, useEffect } from "react";
import { TradeRoute } from "machines/Ship/TradeRoute";
import { CustomSelect } from "components/CustomSelect";
import { useLiveQuery } from "dexie-react-hooks";

const useStyles = makeStyles((theme) => ({
  text: {
    fontSize: 14,
    "& a": {
      color: "white",
    },
  },
  left: {
    display: "flex",
    flexDirection: "column",
  },
  right: {
    display: "flex",
    flexDirection: "column",
    alignItems: "end",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
}));

type Props = { systems?: SystemContext };

export const Best = ({ systems }: Props) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const [routes, setRoutes] = useState<TradeRoute[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [good, setGood] = useState("");
  const goods = useLiveQuery(() => db.markets.orderBy("good").uniqueKeys());

  useEffect(() => {
    const getRoutes = async () => {
      let result = await determineBestTradeRoute("GR-MK-III", 1000, true);
      if (from) result = result.filter((x) => x.buyLocation === from);
      if (to) result = result.filter((x) => x.sellLocation === to);
      if (good) result = result.filter((x) => x.good === good);
      setRoutes(result.slice(0, 50));
    };
    getRoutes();
    const interval = setInterval(() => {
      getRoutes();
    }, 10000);
    return () => clearInterval(interval);
  }, [from, to, good]);

  if (!systems || !goods) return <CircularProgress size={24} />;

  const locations = getLocations(systems).map((x) => x.symbol);
  const columns = [
    ...(isMdDown ? ["Good"] : ["Good", "Qty"]),
    ...(isMdDown ? ["From/To"] : ["From", "To"]),
    ...(isMdDown ? [right("Buy/Sell")] : [right("Buy"), right("Sell")]),
    right("Profit per Unit"),
    right("Total"),
    right(
      <Tooltip title="Cost x Distance x Volume">
        <Typography className={classes.text}>CDV</Typography>
      </Tooltip>
    ),
  ];
  const rows = routes.map((route) => [
    ...(isMdDown
      ? [
          <div className={classes.center}>
            <GoodIcon good={route.good} />
            <NumberFormat
              value={route.quantityAvailable}
              thousandSeparator=","
              displayType="text"
            />
          </div>,
        ]
      : [
          <GoodIcon good={route.good} />,
          <NumberFormat
            value={route.quantityAvailable}
            thousandSeparator=","
            displayType="text"
          />,
        ]),
    ...(isMdDown
      ? [
          <div className={classes.left}>
            <Typography className={classes.text}>
              {getLocationName(systems, route.buyLocation)}
            </Typography>
            <Typography className={classes.text}>
              {getLocationName(systems, route.sellLocation)}
            </Typography>
          </div>,
        ]
      : [
          getLocationName(systems, route.buyLocation),
          getLocationName(systems, route.sellLocation),
        ]),
    ...(isMdDown
      ? [
          <div className={classes.right}>
            <Typography className={classes.text}>
              {route.purchasePricePerUnit}
            </Typography>
            <Typography className={classes.text}>
              {route.sellPricePerUnit}
            </Typography>
          </div>,
        ]
      : [right(route.purchasePricePerUnit), right(route.sellPricePerUnit)]),
    right(
      <NumberFormat
        value={route.profitPerUnit}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
    right(
      <NumberFormat
        value={route.totalProfit}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
    right(
      <NumberFormat
        value={route.costVolumeDistance}
        decimalScale={2}
        fixedDecimalScale
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
  ]);
  return (
    <>
      <CustomSelect
        name="From"
        setValue={setFrom}
        value={from}
        values={locations}
        displayMap={(value) => getLocationName(systems, value as string)}
      />
      <CustomSelect
        name="To"
        setValue={setTo}
        value={to}
        values={locations}
        displayMap={(value) => getLocationName(systems, value as string)}
      />
      <CustomSelect
        name="Good"
        setValue={setGood}
        value={good}
        values={goods}
      />
      <DataTable title="Trade Routes" columns={columns} rows={rows} />
    </>
  );
};
