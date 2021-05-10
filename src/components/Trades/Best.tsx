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
import { getDebug, setDebug } from "data/localStorage/getDebug";
import { DebugCheckbox } from "components/Settings/DebugCheckbox";
import { useLocalStorage } from "components/useLocalStorage";
import { Keys } from "data/localStorage/Keys";
import { AvailableShip } from "api/AvailableShip";

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

type Props = {
  availableShips: AvailableShip[];
};

export const Best = ({ availableShips }: Props) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const [routes, setRoutes] = useState<TradeRouteWithCount[]>([]);
  const [from, setFrom] = useLocalStorage(Keys.Best_From, "");
  const [to, setTo] = useLocalStorage(Keys.Best_To, "");
  const [good, setGood] = useLocalStorage(Keys.Best_Good, "");
  const [ship, setShip] = useLocalStorage(Keys.Best_Ship, "GR-MK-III");

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

      const maxCargo = availableShips.find((p) => p.type === ship)!.maxCargo;
      let result = await determineBestTradeRoute(ship, maxCargo, false, false);
      if (from) result = result.filter((x) => x.buyLocation === from);
      if (to) result = result.filter((x) => x.sellLocation === to);
      if (good) result = result.filter((x) => x.good === good);
      console.log("Found:", result.length);
      setRoutes(
        result.slice(0, 50).map((r) => ({
          ...r,
          shipCount: grouped[getGroupLabel(r)] || 0,
        }))
      );
    };
    if (availableShips.length) getRoutes();
    const interval = setInterval(() => {
      if (availableShips.length) getRoutes();
    }, 10000);
    return () => clearInterval(interval);
  }, [from, to, good, ship, availableShips]);

  if (!goods || !availableShips.length) return <CircularProgress size={24} />;

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
    "Focus",
  ];
  const debug = getDebug();
  const rows = routes.map((route) => [
    ...(isMdDown
      ? [
          <div className={classes.center}>
            <GoodIcon good={route.good} />
            <NumberFormat
              value={route.quantityToBuy}
              thousandSeparator=","
              displayType="text"
            />
          </div>,
        ]
      : [
          <GoodIcon good={route.good} />,
          <NumberFormat
            value={route.quantityToBuy}
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
    <DebugCheckbox
      title=""
      persist={(value) =>
        value
          ? setDebug({
              focusTradeRoute: {
                from: route.buyLocation,
                to: route.sellLocation,
                good: route.good,
              },
            })
          : setDebug({ focusTradeRoute: undefined })
      }
      initialValue={
        debug.focusTradeRoute?.to === route.sellLocation &&
        debug.focusTradeRoute?.from === route.buyLocation &&
        debug.focusTradeRoute?.good === route.good
      }
    />,
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
      <CustomSelect
        name="Ship"
        value={ship}
        setValue={setShip}
        values={availableShips
          .map((av) => av.type)
          .sort((a, b) => a.localeCompare(b))}
        hideAll
      />
      <DataTable title="Trade Routes" columns={columns} rows={rows} />
    </>
  );
};
