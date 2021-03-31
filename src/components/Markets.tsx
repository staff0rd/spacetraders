import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import db from "../data";
import { DataTable, right } from "./DataTable";
import CircularProgress from "@material-ui/core/CircularProgress";
import { DateTime } from "luxon";
import NumberFormat from "react-number-format";
import { makeStyles, useTheme, useMediaQuery } from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
}));

export const Markets = () => {
  const classes = useStyles();
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const [location, setLocation] = useState("");
  const [good, setGood] = useState("");

  const markets = useLiveQuery(() => {
    return db.markets
      .reverse()
      .filter(
        (p) =>
          (location ? p.location === location : true) &&
          (good ? p.good === good : true)
      )
      .limit(50)
      .toArray();
  }, [location, good]);

  const locations = useLiveQuery(() =>
    db.trades.orderBy("location").uniqueKeys()
  );
  const goods = useLiveQuery(() => db.trades.orderBy("good").uniqueKeys());

  if (!markets) return <CircularProgress color="primary" size={24} />;

  const columns = [
    "Location",
    ...(isMdDown ? ["Qty x Good"] : [right("Qty"), "Good"]),
    "㎥",
    right("Buy"),
    right("Sell"),
    right("Spread"),
    "When",
  ];
  const rows = markets.map((market) => [
    market.location,
    ...(isMdDown
      ? [
          <>
            <NumberFormat
              value={market.quantityAvailable}
              thousandSeparator=","
              displayType="text"
            />{" "}
            x {market.good}
          </>,
        ]
      : [
          right(
            <NumberFormat
              value={market.quantityAvailable}
              thousandSeparator=","
              displayType="text"
            />
          ),
          market.good,
        ]),
    market.volumePerUnit,
    right(
      <NumberFormat
        value={market.purchasePricePerUnit}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
    right(
      <NumberFormat
        value={market.sellPricePerUnit}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
    right(
      <NumberFormat
        value={market.purchasePricePerUnit - market.sellPricePerUnit}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),

    DateTime.fromISO(market.created).toRelative(),
  ]);
  return (
    <>
      {locations && (
        <FormControl className={classes.formControl}>
          <InputLabel id="select-type-label">Location</InputLabel>
          <Select
            labelId="select-type-label"
            id="select-type"
            value={location}
            onChange={(e) => setLocation(e.target.value as string)}
          >
            <MenuItem value={""}>All</MenuItem>
            {locations.map((location) => (
              <MenuItem key={location as string} value={location as string}>
                {location}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      {goods && (
        <FormControl className={classes.formControl}>
          <InputLabel id="select-good-label">Good</InputLabel>
          <Select
            labelId="select-good-label"
            id="select-good"
            value={good}
            placeholder="All"
            onChange={(e) => setGood(e.target.value as string)}
          >
            <MenuItem value={""}>All</MenuItem>
            {goods!.map((good: any) => (
              <MenuItem key={good} value={good}>
                {good}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      <DataTable title="Markets" rows={rows} columns={columns} />
    </>
  );
};
