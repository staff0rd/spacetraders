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
import { determineBestTradeRoute } from "machines/Ship/determineBestTradeRoute";
import { useState, useEffect } from "react";
import { TradeRoute } from "machines/Ship/TradeRoute";
import { CustomSelect } from "components/CustomSelect";
import { useLiveQuery } from "dexie-react-hooks";
import { getLocation, getLocations } from "data/localStorage/locationCache";

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

type TradeRouteWithCount = TradeRoute & {
  shipCount: number;
};

export const Best = () => {
  const classes = useStyles();
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const [routes, setRoutes] = useState<TradeRouteWithCount[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [good, setGood] = useState("");
  const goods = useLiveQuery(() => db.markets.orderBy("good").uniqueKeys());

  const getGroupLabel = (value: TradeRoute) =>
    `${value.buyLocation}-${value.sellLocation}-${value.good}`;

  useEffect(() => {
    const getRoutes = async () => {
      type GroupByLabel = {
        [key: string]: number;
      };
      const grouped: GroupByLabel = {};
      const current = await db.tradeRoutes.toArray();
      current.forEach((value) => {
        const label = getGroupLabel(value);
        if (!grouped[label]) {
          grouped[label] = 0;
        }
        grouped[label] += 1;
      });
      let result = await determineBestTradeRoute(
        "GR-MK-III",
        500,
        false,
        false
      );
      if (from) result = result.filter((x) => x.buyLocation === from);
      if (to) result = result.filter((x) => x.sellLocation === to);
      if (good) result = result.filter((x) => x.good === good);
      setRoutes(
        result.slice(0, 50).map((r) => ({
          ...r,
          shipCount: grouped[getGroupLabel(r)] || 0,
        }))
      );
    };
    getRoutes();
    const interval = setInterval(() => {
      getRoutes();
    }, 10000);
    return () => clearInterval(interval);
  }, [from, to, good]);

  if (!goods) return <CircularProgress size={24} />;

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
    "Ships",
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
              {getLocation(route.buyLocation)?.name}
            </Typography>
            <Typography className={classes.text}>
              {getLocation(route.sellLocation)?.name}
            </Typography>
          </div>,
        ]
      : [
          getLocation(route.buyLocation)?.name,
          getLocation(route.sellLocation)?.name,
        ]),
    ...(isMdDown
      ? [
          <div className={classes.right}>
            <Typography className={classes.text}>
              <NumberFormat
                value={route.purchasePricePerUnit}
                thousandSeparator=","
                displayType="text"
                prefix="$"
              />
            </Typography>
            <Typography className={classes.text}>
              <NumberFormat
                value={route.sellPricePerUnit}
                thousandSeparator=","
                displayType="text"
                prefix="$"
              />
            </Typography>
          </div>,
        ]
      : [
          right(
            <NumberFormat
              value={route.purchasePricePerUnit}
              thousandSeparator=","
              displayType="text"
              prefix="$"
            />
          ),
          right(
            <NumberFormat
              value={route.sellPricePerUnit}
              thousandSeparator=","
              displayType="text"
              prefix="$"
            />
          ),
        ]),
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
    route.shipCount,
  ]);

  const locations = getLocations().map((p) => p.symbol);
  return (
    <>
      <CustomSelect
        name="From"
        setValue={setFrom}
        value={from}
        values={locations}
        displayMap={(value) => getLocation(value as string)?.name}
      />
      <CustomSelect
        name="To"
        setValue={setTo}
        value={to}
        values={locations}
        displayMap={(value) => getLocation(value as string)?.name}
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
