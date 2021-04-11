import { useLiveQuery } from "dexie-react-hooks";
import db from "data";
import { DataTable, right } from "../DataTable";
import {
  CircularProgress,
  makeStyles,
  Typography,
  useTheme,
  useMediaQuery,
} from "@material-ui/core";
import NumberFormat from "react-number-format";
import { Link } from "react-router-dom";
import { DateTime } from "luxon";
import { GoodIcon } from "./GoodIcon";
import { SystemContext } from "machines/MarketContext";
import { getLocationName } from "./getLocations";

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
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
}));

type Props = { systems?: SystemContext };

export const Current = ({ systems }: Props) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const routes = useLiveQuery(() =>
    db.tradeRoutes.reverse().limit(50).toArray()
  );
  const shipDetail = useLiveQuery(() => db.shipDetail.toArray());
  if (!routes || !shipDetail || !systems) return <CircularProgress size={24} />;

  const columns = [
    "Ship",
    ...(isMdDown ? ["Buy/Sell"] : ["Buy", "Sell"]),
    "Distance",
    ...(isMdDown ? ["Good"] : ["Good", "Qty"]),
    "Profit / Unit",
    right("Total"),
    "",
  ];
  const rows = routes.map((route) => [
    <Typography className={classes.text}>
      <Link to={`/ships/owned/${route.shipId}`}>
        {shipDetail?.find((sd) => sd.shipId === route.shipId)?.name}
      </Link>
    </Typography>,
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
    <NumberFormat
      value={Math.round(route.distance)}
      thousandSeparator=","
      displayType="text"
    />,
    ...(isMdDown
      ? [
          <div className={classes.center}>
            <NumberFormat
              value={route.quantityToBuy}
              thousandSeparator=","
              displayType="text"
            />
            <GoodIcon good={route.good} />
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
    <NumberFormat
      value={route.profitPerUnit}
      thousandSeparator=","
      displayType="text"
      prefix="$"
    />,
    right(
      <NumberFormat
        value={route.totalProfit}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
    DateTime.fromISO(route.created).toRelative(),
  ]);
  return <DataTable title="Trade Routes" columns={columns} rows={rows} />;
};
